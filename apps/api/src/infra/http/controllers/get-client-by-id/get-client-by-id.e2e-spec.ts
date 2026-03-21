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
import { ClientFactory } from 'test/factories/make-client'

describe('GetClientByIdController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwtFactory: JwtFactory
	let clientFactory: ClientFactory
	let preSeededClientId: string

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)
		const moduleRef = await Test.createTestingModule({
			imports: [DatabaseModule, BetterAuthModule, EnvModule, testAppModule],
			providers: [JwtFactory, ClientFactory],
		}).compile()

		app = moduleRef.createNestApplication()
		prisma = moduleRef.get(PrismaService)
		jwtFactory = moduleRef.get(JwtFactory)
		clientFactory = moduleRef.get(ClientFactory)

		await app.init()

		const clientAuth = await prisma.identityProvider.findFirst({
			where: { providerUserId: authUserClientIdE2E },
		})
		if (!clientAuth?.userId) throw new Error('Client not found')
		preSeededClientId = clientAuth.userId
	})

	afterAll(async () => {
		await app.close()
	})

	it('[GET] /tenants/:id - should return client when found', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		const response = await request(app.getHttpServer())
			.get(`/tenants/${preSeededClientId}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body.data).toBeDefined()
		expect(response.body.data.id).toBe(preSeededClientId)
	})

	it('[GET] /tenants/:id - should return 404 when client not found', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		await request(app.getHttpServer())
			.get(`/tenants/${faker.string.uuid()}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(404)
	})

	it('[GET] /tenants/:id - should reject CLIENT auth', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		await request(app.getHttpServer())
			.get(`/tenants/${preSeededClientId}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(403)
	})
})
