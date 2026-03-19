import { DatabaseModule } from '@/infra/database/database.module'
import { EnvModule } from '@/infra/env/env.module'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { ClientFactory } from 'test/factories/make-client'
import { BlobStorageModule } from '@/infra/blob-storage/blob-storage.module'
import { DocumentRequestFactory } from 'test/factories/make-document-request'
import { DocumentFactory } from 'test/factories/make-document'
import { BlobStorageService } from '@/infra/blob-storage/blob-storage.service'
import { createTestAppModule } from 'test/utils/test-app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('DownloadDocumentController (E2E)', () => {
	let app: INestApplication
	let jwtFactory: JwtFactory
	let clientFactory: ClientFactory
	let documentFactory: DocumentFactory
	let blobStorageService: BlobStorageService

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)
		const moduleRef = await Test.createTestingModule({
			imports: [
				DatabaseModule,
				BetterAuthModule,
				EnvModule,
				testAppModule,
				BlobStorageModule,
			],
			providers: [
				JwtFactory,
				ClientFactory,
				DocumentRequestFactory,
				DocumentFactory,
				BlobStorageService,
			],
		}).compile()

		app = moduleRef.createNestApplication()
		jwtFactory = moduleRef.get(JwtFactory)
		clientFactory = moduleRef.get(ClientFactory)
		documentFactory = moduleRef.get(DocumentFactory)
		blobStorageService = moduleRef.get(BlobStorageService)

		await app.init()
	})

	it('[POST] /documents/download - generates a download url for existing document', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const client = await clientFactory.makePrismaClient()

		const document = await documentFactory.makePrismaDocument({
			clientId: client.id,
			blobName: 'test-blob-123',
		})

		await blobStorageService.onModuleInit()

		const containerClient = await blobStorageService.getContainerClient()

		const blobClient = containerClient.getBlockBlobClient(document.blobName)

		await blobClient.upload('Test content for download', 30)

		const downloadDocumentRequest = {
			documentId: document.id.toString(),
		}

		const response = await request(app.getHttpServer())
			.post('/documents/download')
			.set({
				// biome-ignore lint/style/useNamingConvention: This header is used with capitalization
				Authorization: `Bearer ${jwt}`,
			})
			.send(downloadDocumentRequest)

		expect(response.status).toBe(201)
		expect(response.body).toHaveProperty('downloadUrl')
		expect(response.body.downloadUrl).toContain(document.blobName)
	})

	it('[POST] /documents/download - returns 404 when document does not exist', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const downloadDocumentRequest = {
			documentId: 'non-existent-document-id',
		}

		const response = await request(app.getHttpServer())
			.post('/documents/download')
			.set({
				// biome-ignore lint/style/useNamingConvention: <This is fine>
				Authorization: `Bearer ${jwt}`,
			})
			.send(downloadDocumentRequest)

		expect(response.status).toBe(404)
	})

	it('[POST] /documents/download - returns 404 when blob does not exist in storage', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const client = await clientFactory.makePrismaClient()

		const document = await documentFactory.makePrismaDocument({
			clientId: client.id,
			blobName: 'non-existent-blob',
		})

		const downloadDocumentRequest = {
			documentId: document.id.toString(),
		}

		const response = await request(app.getHttpServer())
			.post('/documents/download')
			.set({
				// biome-ignore lint/style/useNamingConvention: <This is fine>
				Authorization: `Bearer ${jwt}`,
			})
			.send(downloadDocumentRequest)

		expect(response.status).toBe(404)
	})
})
