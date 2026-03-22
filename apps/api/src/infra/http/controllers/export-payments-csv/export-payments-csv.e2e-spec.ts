import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { faker } from '@faker-js/faker'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import {
	authUserClientIdE2E,
	authUserEmployerIdE2E,
} from 'test/utils/auth-user-id-e2e'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('ExportPaymentsCsvController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwtFactory: JwtFactory
	let employeeId: string
	let clientId: string
	let propertyId: string
	let leaseId: string

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

		const employeeAuth = await prisma.identityProvider.findFirst({
			where: { providerUserId: authUserEmployerIdE2E },
		})
		if (!employeeAuth?.userId) throw new Error('Employee not found')
		employeeId = employeeAuth.userId

		const clientAuth = await prisma.identityProvider.findFirst({
			where: { providerUserId: authUserClientIdE2E },
		})
		if (!clientAuth?.userId) throw new Error('Client not found')
		clientId = clientAuth.userId

		const property = await prisma.property.create({
			data: {
				id: faker.string.uuid(),
				managerId: employeeId,
				address: '123 Export Test St',
				city: faker.location.city(),
				state: faker.location.state({ abbreviated: true }),
				zipCode: faker.location.zipCode(),
				propertyType: 'APARTMENT',
				bedrooms: 2,
				bathrooms: 1,
				rentAmount: 1500,
				status: 'OCCUPIED',
				createdAt: new Date(),
			},
		})
		propertyId = property.id

		const lease = await prisma.lease.create({
			data: {
				id: faker.string.uuid(),
				propertyId,
				tenantId: clientId,
				startDate: new Date('2025-01-01'),
				endDate: new Date('2025-12-31'),
				monthlyRent: 1500,
				securityDeposit: 3000,
				status: 'ACTIVE',
				createdAt: new Date(),
			},
		})
		leaseId = lease.id
	})

	afterEach(async () => {
		await prisma.payment.deleteMany({ where: { leaseId } })
	})

	afterAll(async () => {
		await prisma.lease.deleteMany({ where: { id: leaseId } })
		await prisma.property.deleteMany({ where: { id: propertyId } })
		await app.close()
	})

	it('[GET] /payments/export - should return CSV with correct headers', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		await prisma.payment.create({
			data: {
				id: faker.string.uuid(),
				leaseId,
				tenantId: clientId,
				amount: 1500,
				dueDate: new Date('2025-03-01'),
				status: 'PAID',
				paidAt: new Date('2025-03-01'),
				createdAt: new Date(),
			},
		})

		const response = await request(app.getHttpServer())
			.get('/payments/export')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.headers['content-type']).toMatch(/text\/csv/)
		expect(response.text).toContain(
			'Tenant Name,Property Address,Amount,Due Date,Status,Paid At',
		)
		expect(response.text).toContain('123 Export Test St')
	})

	it('[GET] /payments/export?status=PAID - should only include PAID payments', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		await prisma.payment.create({
			data: {
				id: faker.string.uuid(),
				leaseId,
				tenantId: clientId,
				amount: 1500,
				dueDate: new Date('2025-03-01'),
				status: 'PAID',
				paidAt: new Date('2025-03-01'),
				createdAt: new Date(),
			},
		})

		await prisma.payment.create({
			data: {
				id: faker.string.uuid(),
				leaseId,
				tenantId: clientId,
				amount: 1500,
				dueDate: new Date('2025-04-01'),
				status: 'OVERDUE',
				createdAt: new Date(),
			},
		})

		const response = await request(app.getHttpServer())
			.get('/payments/export?status=PAID')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		const lines = response.text.split('\n')
		// header + 1 PAID row
		expect(lines.length).toBe(2)
		expect(lines[1]).toContain('PAID')
	})

	it('[GET] /payments/export - should return 403 for CLIENT users', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		await request(app.getHttpServer())
			.get('/payments/export')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(403)
	})
})
