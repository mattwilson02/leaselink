import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { faker } from '@faker-js/faker'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('GetDocumentRequestByIdController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwtFactory: JwtFactory

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)
		const moduleRef = await Test.createTestingModule({
			imports: [DatabaseModule, BetterAuthModule, EnvModule, testAppModule],
			providers: [JwtFactory],
		}).compile()

		app = moduleRef.createNestApplication()
		prisma = moduleRef.get(PrismaService)
		jwtFactory = moduleRef.get(JwtFactory)

		await app.init()
	})

	it('[GET] /document-requests/:id - should return the document request if it exists', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const client = await prisma.client.create({
			data: {
				id: faker.string.uuid(),
				name: faker.person.fullName(),
				email: faker.internet.email(),
				phoneNumber: faker.phone.number(),
			},
		})

		const documentRequest = await prisma.documentRequest.create({
			data: {
				id: faker.string.uuid(),
				clientId: client.id,
				requestedBy: faker.string.uuid(),
				requestType: 'PROOF_OF_ADDRESS',
				status: 'PENDING',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		})

		const response = await request(app.getHttpServer())
			.get(`/document-requests/${documentRequest.id}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: <This is fine>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body).toBeDefined()
		expect(response.body.id).toBe(documentRequest.id)
		expect(response.body.clientId).toBe(documentRequest.clientId)
		expect(response.body.requestType).toBe('PROOF_OF_ADDRESS')
		expect(response.body.status).toBe('PENDING')
	})

	it('[GET] /document-requests/:id - should return 404 if document request does not exist', async () => {
		const { jwt } = await jwtFactory.makeJwt()
		const nonExistentId = faker.string.uuid()

		await request(app.getHttpServer())
			.get(`/document-requests/${nonExistentId}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: <This is fine>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(404)
	})
})
