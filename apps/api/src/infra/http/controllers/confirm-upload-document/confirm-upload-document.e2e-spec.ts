import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { ClientFactory } from 'test/factories/make-client'
import { BlobStorageModule } from '@/infra/blob-storage/blob-storage.module'
import { DocumentRequestType } from '@/domain/document/enterprise/entities/value-objects/document-request-type'
import { DocumentRequestStatus } from '@/domain/document/enterprise/entities/value-objects/document-request-status'
import { DocumentRequestFactory } from 'test/factories/make-document-request'
import { DocumentFolder } from '@/domain/document/enterprise/entities/value-objects/document-folders'
import { BlobStorageService } from '@/infra/blob-storage/blob-storage.service'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('ConfirmUploadDocumentController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let blobStorageService: BlobStorageService
	let jwtFactory: JwtFactory
	let clientFactory: ClientFactory
	let documentRequestFactory: DocumentRequestFactory

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
				BlobStorageService,
			],
		}).compile()

		app = moduleRef.createNestApplication()
		jwtFactory = moduleRef.get(JwtFactory)
		prisma = moduleRef.get(PrismaService)
		clientFactory = moduleRef.get(ClientFactory)
		documentRequestFactory = moduleRef.get(DocumentRequestFactory)
		blobStorageService = moduleRef.get(BlobStorageService)

		await app.init()
	})

	afterAll(async () => {
		await app.close()
	})

	it('[POST] /documents/upload - generates an upload url', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const client = await clientFactory.makePrismaClient()

		const documentRequest =
			await documentRequestFactory.makePrismaDocumentRequest({
				clientId: client.id,
				requestedBy: client.id,
				requestType: DocumentRequestType.create('PROOF_OF_IDENTITY'),
				status: DocumentRequestStatus.create('PENDING'),
			})

		await blobStorageService.onModuleInit()

		const containerClient = await blobStorageService.getContainerClient()

		const blobName = `test-blob-${Date.now()}.txt`
		const blobClient = containerClient.getBlockBlobClient(blobName)
		await blobClient.upload('Test content', 12)

		const confirmUploadDocumentRequest = {
			documentRequestId: documentRequest.id.toString(),
			blobName: blobName,
			clientId: client.id.toString(),
			contentKey: 'test-content-key',
			name: 'Test Document',
			fileSize: 123456,
			thumbnailBlobName: null,
			folder: DocumentFolder.create('PROOF_OF_IDENTITY').value,
			uploadedBy: client.id.toString(),
		}

		const response = await request(app.getHttpServer())
			.post('/documents/confirm-upload')
			.set({
				// biome-ignore lint/style/useNamingConvention: <This is fine>
				Authorization: `Bearer ${jwt}`,
			})
			.send(confirmUploadDocumentRequest)

		expect(response.status).toBe(201)
		expect(response.body).toHaveProperty('document')

		const docRequest = await prisma.document.findFirst({
			where: {
				clientId: documentRequest.clientId.toString(),
				blobName: confirmUploadDocumentRequest.blobName,
			},
		})
		expect(docRequest).not.toBeFalsy()
	})
})
