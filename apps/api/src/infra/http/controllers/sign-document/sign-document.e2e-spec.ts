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

describe('SignDocumentController (E2E)', () => {
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

	describe('[POST] /documents/:id/sign/upload', () => {
		it('should generate an upload URL for a signable document', async () => {
			const { jwt } = await jwtFactory.makeJwt()
			const client = await clientFactory.makePrismaClient()
			const document = await documentFactory.makePrismaDocument({
				clientId: client.id,
				folder: DocumentFolder.create('LEASE_AGREEMENTS'),
			})

			const response = await request(app.getHttpServer())
				.post(`/documents/${document.id.toString()}/sign/upload`)
				// biome-ignore lint/style/useNamingConvention: HTTP header name
				.set({ Authorization: `Bearer ${jwt}` })

			expect(response.status).toBe(201)
			expect(response.body).toHaveProperty('uploadUrl')
			expect(response.body).toHaveProperty('blobName')
			expect(response.body.blobName).toContain(
				`signatures/${document.id.toString()}/`,
			)
		})

		it('should return 404 when document does not exist', async () => {
			const { jwt } = await jwtFactory.makeJwt()

			const response = await request(app.getHttpServer())
				.post('/documents/non-existent-id/sign/upload')
				// biome-ignore lint/style/useNamingConvention: HTTP header name
				.set({ Authorization: `Bearer ${jwt}` })

			expect(response.status).toBe(404)
		})

		it('should return 401 when not authenticated', async () => {
			const response = await request(app.getHttpServer()).post(
				'/documents/some-id/sign/upload',
			)

			expect(response.status).toBe(401)
		})
	})

	describe('[POST] /documents/:id/sign', () => {
		it('should sign a document successfully', async () => {
			const { jwt } = await jwtFactory.makeJwt(true)
			const client = await clientFactory.makePrismaClient()
			const document = await documentFactory.makePrismaDocument({
				clientId: client.id,
				folder: DocumentFolder.create('LEASE_AGREEMENTS'),
			})

			await blobStorageService.onModuleInit()
			const containerClient = await blobStorageService.getContainerClient()
			const blobName = `signatures/${document.id.toString()}/test-sig.png`
			const blobClient = containerClient.getBlockBlobClient(blobName)
			await blobClient.upload('fake-png-data', 14)

			const response = await request(app.getHttpServer())
				.post(`/documents/${document.id.toString()}/sign`)
				// biome-ignore lint/style/useNamingConvention: HTTP header name
				.set({ Authorization: `Bearer ${jwt}` })
				.send({ signatureImageKey: blobName })

			expect(response.status).toBe(201)
			expect(response.body).toHaveProperty('signature')
			expect(response.body.signature.documentId).toBe(document.id.toString())
		})

		it('should return 400 when document is in a non-signable folder', async () => {
			const { jwt } = await jwtFactory.makeJwt()
			const client = await clientFactory.makePrismaClient()
			const document = await documentFactory.makePrismaDocument({
				clientId: client.id,
				folder: DocumentFolder.create('IDENTIFICATION'),
			})

			const response = await request(app.getHttpServer())
				.post(`/documents/${document.id.toString()}/sign`)
				// biome-ignore lint/style/useNamingConvention: HTTP header name
				.set({ Authorization: `Bearer ${jwt}` })
				.send({ signatureImageKey: 'some-key.png' })

			expect(response.status).toBe(400)
		})

		it('should return 404 when signature image blob does not exist', async () => {
			const { jwt } = await jwtFactory.makeJwt()
			const client = await clientFactory.makePrismaClient()
			const document = await documentFactory.makePrismaDocument({
				clientId: client.id,
				folder: DocumentFolder.create('LEASE_AGREEMENTS'),
			})

			const response = await request(app.getHttpServer())
				.post(`/documents/${document.id.toString()}/sign`)
				// biome-ignore lint/style/useNamingConvention: HTTP header name
				.set({ Authorization: `Bearer ${jwt}` })
				.send({ signatureImageKey: 'non-existent-signature.png' })

			expect(response.status).toBe(404)
		})

		it('should return 409 when document is already signed', async () => {
			const { jwt } = await jwtFactory.makeJwt(true)
			const client = await clientFactory.makePrismaClient()
			const document = await documentFactory.makePrismaDocument({
				clientId: client.id,
				folder: DocumentFolder.create('LEASE_AGREEMENTS'),
			})

			await blobStorageService.onModuleInit()
			const containerClient = await blobStorageService.getContainerClient()
			const blobName = `signatures/${document.id.toString()}/test-sig2.png`
			const blobClient = containerClient.getBlockBlobClient(blobName)
			await blobClient.upload('fake-png-data', 14)

			// First sign
			await request(app.getHttpServer())
				.post(`/documents/${document.id.toString()}/sign`)
				// biome-ignore lint/style/useNamingConvention: HTTP header name
				.set({ Authorization: `Bearer ${jwt}` })
				.send({ signatureImageKey: blobName })

			// Attempt to sign again
			const response = await request(app.getHttpServer())
				.post(`/documents/${document.id.toString()}/sign`)
				// biome-ignore lint/style/useNamingConvention: HTTP header name
				.set({ Authorization: `Bearer ${jwt}` })
				.send({ signatureImageKey: blobName })

			expect(response.status).toBe(409)
		})

		it('should return 404 when document does not exist', async () => {
			const { jwt } = await jwtFactory.makeJwt()

			const response = await request(app.getHttpServer())
				.post('/documents/non-existent-id/sign')
				// biome-ignore lint/style/useNamingConvention: HTTP header name
				.set({ Authorization: `Bearer ${jwt}` })
				.send({ signatureImageKey: 'some-blob.png' })

			expect(response.status).toBe(404)
		})

		it('should return 401 when not authenticated', async () => {
			const response = await request(app.getHttpServer())
				.post('/documents/some-id/sign')
				.send({ signatureImageKey: 'some-blob.png' })

			expect(response.status).toBe(401)
		})
	})
})
