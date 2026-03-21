import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('GetDashboardSummaryController (E2E)', () => {
	let app: INestApplication
	let jwtFactory: JwtFactory

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)
		const moduleRef = await Test.createTestingModule({
			imports: [DatabaseModule, BetterAuthModule, EnvModule, testAppModule],
			providers: [JwtFactory],
		}).compile()

		app = moduleRef.createNestApplication()
		jwtFactory = moduleRef.get(JwtFactory)

		await app.init()
	})

	afterAll(async () => {
		await app.close()
	})

	it('[GET] /dashboard/summary - should return summary object for EMPLOYEE', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		const response = await request(app.getHttpServer())
			.get('/dashboard/summary')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		const body = response.body

		// Properties section
		expect(body.properties).toBeDefined()
		expect(typeof body.properties.total).toBe('number')
		expect(typeof body.properties.vacant).toBe('number')
		expect(typeof body.properties.listed).toBe('number')
		expect(typeof body.properties.occupied).toBe('number')
		expect(typeof body.properties.maintenance).toBe('number')

		// Tenants section
		expect(body.tenants).toBeDefined()
		expect(typeof body.tenants.total).toBe('number')
		expect(typeof body.tenants.active).toBe('number')
		expect(typeof body.tenants.invited).toBe('number')

		// Leases section
		expect(body.leases).toBeDefined()
		expect(typeof body.leases.active).toBe('number')
		expect(typeof body.leases.pending).toBe('number')
		expect(typeof body.leases.expiringWithin30Days).toBe('number')
		expect(typeof body.leases.expiringWithin60Days).toBe('number')

		// Maintenance section
		expect(body.maintenance).toBeDefined()
		expect(typeof body.maintenance.open).toBe('number')
		expect(typeof body.maintenance.inProgress).toBe('number')
		expect(typeof body.maintenance.resolved).toBe('number')
		expect(typeof body.maintenance.emergencyOpen).toBe('number')

		// Payments section
		expect(body.payments).toBeDefined()
		expect(typeof body.payments.expectedThisMonth).toBe('number')
		expect(typeof body.payments.collectedThisMonth).toBe('number')
		expect(typeof body.payments.overdueTotal).toBe('number')
		expect(typeof body.payments.overdueCount).toBe('number')
		expect(typeof body.payments.pendingCount).toBe('number')

		// Arrays
		expect(Array.isArray(body.upcomingLeaseExpirations)).toBe(true)
		expect(Array.isArray(body.recentActivity)).toBe(true)
	})

	it('[GET] /dashboard/summary - should reject CLIENT auth', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		await request(app.getHttpServer())
			.get('/dashboard/summary')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(403)
	})
})
