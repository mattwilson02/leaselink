import { DatabaseModule } from '@/infra/database/database.module'
import { EnvModule } from '@/infra/env/env.module'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { ClientFactory } from 'test/factories/make-client'
import { DocumentFactory } from 'test/factories/make-document'
import { BlobStorageModule } from '@/infra/blob-storage/blob-storage.module'
import { BlobStorageService } from '@/infra/blob-storage/blob-storage.service'
import { createTestAppModule } from 'test/utils/test-app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { DocumentFolder } from '@/domain/document/enterprise/entities/value-objects/document-folders'

describe('GetSignatureController (E2E)', () => {
	let app: INestApplication
	let jwtFactory: JwtFactory
	let clientFactory: ClientFactory
	let documentFactory: DocumentFactory
	let blobStorageService: BlobStorageService
	let prisma: PrismaService

	beforeAll(async () => {
		prisma = new PrismaService()
		const testAppModule = createTestAppModule(prisma)
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

	afterAll(async () => {
		await app.close()
	})

	describe('[GET] /documents/:id/signature', () => {
		it('should return 404 when no signature exists for a document', async () => {
			const { jwt } = await jwtFactory.makeJwt()
			const client = await clientFactory.makePrismaClient()
			const document = await documentFactory.makePrismaDocument({
				clientId: client.id,
				folder: DocumentFolder.create('LEASE_AGREEMENTS'),
			})

			const response = await request(app.getHttpServer())
				.get(`/documents/${document.id.toString()}/signature`)
				// biome-ignore lint/style/useNamingConvention: HTTP header name
				.set({ Authorization: `Bearer ${jwt}` })

			expect(response.status).toBe(404)
		})

		it('should return the signature after a document is signed', async () => {
			const { jwt: clientJwt } = await jwtFactory.makeJwt(true)
			const { jwt: employeeJwt } = await jwtFactory.makeJwt()
			const client = await clientFactory.makePrismaClient()
			const document = await documentFactory.makePrismaDocument({
				clientId: client.id,
				folder: DocumentFolder.create('LEASE_AGREEMENTS'),
			})

			await blobStorageService.onModuleInit()
			const containerClient = await blobStorageService.getContainerClient()
			const blobName = `signatures/${document.id.toString()}/sig-get.png`
			const blobClient = containerClient.getBlockBlobClient(blobName)
			await blobClient.upload('fake-png-data', 14)

			// Sign the document first (CLIENT jwt required — signed_by is FK to clients.id)
			await request(app.getHttpServer())
				.post(`/documents/${document.id.toString()}/sign`)
				// biome-ignore lint/style/useNamingConvention: HTTP header name
				.set({ Authorization: `Bearer ${clientJwt}` })
				.send({ signatureImageKey: blobName })

			// Now get the signature (EMPLOYEE jwt — no ownership restriction)
			const response = await request(app.getHttpServer())
				.get(`/documents/${document.id.toString()}/signature`)
				// biome-ignore lint/style/useNamingConvention: HTTP header name
				.set({ Authorization: `Bearer ${employeeJwt}` })

			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty('signature')
			expect(response.body.signature.documentId).toBe(document.id.toString())
			expect(response.body.signature.signatureImageKey).toBe(blobName)
		})

		it('should return 404 when document does not exist', async () => {
			const { jwt } = await jwtFactory.makeJwt()

			const response = await request(app.getHttpServer())
				.get('/documents/non-existent-id/signature')
				// biome-ignore lint/style/useNamingConvention: HTTP header name
				.set({ Authorization: `Bearer ${jwt}` })

			expect(response.status).toBe(404)
		})

		it('should return 401 when not authenticated', async () => {
			const response = await request(app.getHttpServer()).get(
				'/documents/some-id/signature',
			)

			expect(response.status).toBe(401)
		})
	})
})
