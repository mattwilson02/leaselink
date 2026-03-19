import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { ClientFactory } from 'test/factories/make-client'
import { faker } from '@faker-js/faker'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('CreateDocumentRequestController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwtFactory: JwtFactory
	let clientFactory: ClientFactory

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)
		const moduleRef = await Test.createTestingModule({
			imports: [DatabaseModule, BetterAuthModule, EnvModule, testAppModule],
			providers: [JwtFactory, ClientFactory],
		}).compile()

		app = moduleRef.createNestApplication()
		jwtFactory = moduleRef.get(JwtFactory)
		prisma = moduleRef.get(PrismaService)
		clientFactory = moduleRef.get(ClientFactory)

		await app.init()
	})

	afterAll(async () => {
		await app.close()
	})

	it('[POST] /document-requests - creates a document request', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const client = await clientFactory.makePrismaClient()

		const newDocumentRequest = {
			clientId: client.id.toString(),
			requestedBy: faker.string.uuid(),
			requestType: 'PROOF_OF_ADDRESS',
		}

		const response = await request(app.getHttpServer())
			.post('/document-requests')
			.set({
				// biome-ignore lint/style/useNamingConvention: <This is fine>
				Authorization: `Bearer ${jwt}`,
			})
			.send(newDocumentRequest)

		expect(response.status).toBe(201)
		expect(response.body).toHaveProperty('id')
		expect(response.body).toHaveProperty(
			'clientId',
			newDocumentRequest.clientId,
		)
		expect(response.body).toHaveProperty(
			'requestedBy',
			newDocumentRequest.requestedBy,
		)
		expect(response.body).toHaveProperty(
			'requestType',
			newDocumentRequest.requestType,
		)

		const docRequest = await prisma.documentRequest.findFirst({
			where: {
				clientId: newDocumentRequest.clientId,
				requestedBy: newDocumentRequest.requestedBy,
			},
		})
		expect(docRequest).not.toBeFalsy()
	})
})
