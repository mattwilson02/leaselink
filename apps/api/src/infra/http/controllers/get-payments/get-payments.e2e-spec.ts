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

describe('GetPaymentsController (E2E)', () => {
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
				address: faker.location.streetAddress(),
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
				startDate: new Date('2024-01-01'),
				endDate: new Date('2024-12-31'),
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

	it('[GET] /payments - should return payments for EMPLOYEE', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		await prisma.payment.create({
			data: {
				id: faker.string.uuid(),
				leaseId,
				tenantId: clientId,
				amount: 1500,
				dueDate: new Date('2024-01-01'),
				status: 'PENDING',
				createdAt: new Date(),
			},
		})

		const response = await request(app.getHttpServer())
			.get('/payments')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body.payments).toBeDefined()
		expect(Array.isArray(response.body.payments)).toBe(true)
		expect(typeof response.body.totalCount).toBe('number')
	})

	it('[GET] /payments - should reject CLIENT auth', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		await request(app.getHttpServer())
			.get('/payments')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(403)
	})
})
