import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { createTestAppModule } from 'test/utils/test-app.module'
import { ClientFactory } from 'test/factories/make-client'

describe('GetClientsController (E2E)', () => {
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
		prisma = moduleRef.get(PrismaService)
		jwtFactory = moduleRef.get(JwtFactory)
		clientFactory = moduleRef.get(ClientFactory)

		await app.init()
	})

	afterAll(async () => {
		await app.close()
	})

	it('[GET] /tenants - should return paginated clients for EMPLOYEE', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		const response = await request(app.getHttpServer())
			.get('/tenants')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body.data).toBeDefined()
		expect(Array.isArray(response.body.data)).toBe(true)
		expect(response.body.meta).toBeDefined()
		expect(response.body.meta.page).toBe(1)
		expect(response.body.meta.pageSize).toBe(20)
		expect(typeof response.body.meta.totalCount).toBe('number')
		expect(typeof response.body.meta.totalPages).toBe('number')
	})

	it('[GET] /tenants?status=ACTIVE - should filter by status', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		const response = await request(app.getHttpServer())
			.get('/tenants?status=ACTIVE')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(Array.isArray(response.body.data)).toBe(true)
		// biome-ignore lint/suspicious/noExplicitAny: test assertion
		response.body.data.forEach((client: any) => {
			expect(client.status).toBe('ACTIVE')
		})
	})

	it('[GET] /tenants - should reject CLIENT auth', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		await request(app.getHttpServer())
			.get('/tenants')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(403)
	})
})
