import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { faker } from '@faker-js/faker'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { authUserClientIdE2E } from 'test/utils/auth-user-id-e2e'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('GetDocumentRequestsByClientIdController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwtFactory: JwtFactory
	let clientId: string

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

		const clientAuth = await prisma.identityProvider.findFirst({
			where: {
				providerUserId: authUserClientIdE2E,
			},
		})

		if (!clientAuth?.userId) {
			throw new Error('Client ID not found')
		}

		clientId = clientAuth?.userId
	})

	afterEach(async () => {
		await prisma.documentRequest.deleteMany({
			where: {
				clientId: clientId,
			},
		})
	})

	it('[GET] /document-requests - should return all document requests for a client', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		const docReq1 = await prisma.documentRequest.create({
			data: {
				id: faker.string.uuid(),
				clientId: clientId,
				requestedBy: faker.string.uuid(),
				requestType: 'PROOF_OF_ADDRESS',
				status: 'PENDING',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		})

		const docReq2 = await prisma.documentRequest.create({
			data: {
				id: faker.string.uuid(),
				clientId: clientId,
				requestedBy: faker.string.uuid(),
				requestType: 'PROOF_OF_IDENTITY',
				status: 'UPLOADED',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		})

		const response = await request(app.getHttpServer())
			.get('/document-requests')
			.set({
				// biome-ignore lint/style/useNamingConvention: <Bearer is fine>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body).toBeDefined()
		expect(Array.isArray(response.body.documentRequests)).toBe(true)
		expect(response.body.documentRequests.length).toBe(2)
		// biome-ignore lint/suspicious/noExplicitAny: <Ignoring any because type safety isn't relevant for this test>
		const ids = response.body.documentRequests.map((dr: any) => dr.id)
		expect(ids).toContain(docReq1.id)
		expect(ids).toContain(docReq2.id)
	})

	it('[GET] /document-requests?requestType=PROOF_OF_ADDRESS - should filter by requestType', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		if (!clientId) {
			throw new Error('Client ID not found')
		}

		const docReq1 = await prisma.documentRequest.create({
			data: {
				id: faker.string.uuid(),
				clientId: clientId,
				requestedBy: faker.string.uuid(),
				requestType: 'PROOF_OF_ADDRESS',
				status: 'PENDING',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		})

		await prisma.documentRequest.create({
			data: {
				id: faker.string.uuid(),
				clientId: clientId,
				requestedBy: faker.string.uuid(),
				requestType: 'PROOF_OF_IDENTITY',
				status: 'UPLOADED',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		})

		const response = await request(app.getHttpServer())
			.get('/document-requests?requestType=PROOF_OF_ADDRESS')
			.set({
				// biome-ignore lint/style/useNamingConvention: <Bearer is fine>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body).toBeDefined()
		expect(Array.isArray(response.body.documentRequests)).toBe(true)
		expect(response.body.documentRequests.length).toBe(1)
		expect(response.body.documentRequests[0].id).toBe(docReq1.id)
		expect(response.body.documentRequests[0].requestType).toBe(
			'PROOF_OF_ADDRESS',
		)
	})
})
