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
import { createTestAppModule } from 'test/utils/test-app.module'

describe('UploadDocumentController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
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
			providers: [JwtFactory, ClientFactory, DocumentRequestFactory],
		}).compile()

		app = moduleRef.createNestApplication()
		jwtFactory = moduleRef.get(JwtFactory)
		prisma = moduleRef.get(PrismaService)
		clientFactory = moduleRef.get(ClientFactory)
		documentRequestFactory = moduleRef.get(DocumentRequestFactory)

		await app.init()
	})

	afterAll(async () => {
		await app.close()
	})

	it('[POST] /documents/upload - generates an upload url and thumbnail upload url', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const client = await clientFactory.makePrismaClient()

		const documentRequest =
			await documentRequestFactory.makePrismaDocumentRequest({
				clientId: client.id,
				requestedBy: client.id,
				requestType: DocumentRequestType.create('PROOF_OF_IDENTITY'),
				status: DocumentRequestStatus.create('PENDING'),
			})

		const uploadDocumentRequest = {
			documentRequestId: documentRequest.id.toString(),
		}

		const response = await request(app.getHttpServer())
			.post('/documents/upload')
			.set({
				// biome-ignore lint/style/useNamingConvention: <This is fine>
				Authorization: `Bearer ${jwt}`,
			})
			.send(uploadDocumentRequest)

		expect(response.status).toBe(201)
		expect(response.body).toHaveProperty('uploadUrl')
		expect(response.body).toHaveProperty('thumbnailUploadUrl')

		const docRequest = await prisma.documentRequest.findFirst({
			where: {
				clientId: documentRequest.clientId.toString(),
				requestedBy: documentRequest.requestedBy.toString(),
			},
		})
		expect(docRequest).not.toBeFalsy()
	})
})
