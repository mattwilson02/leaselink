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

describe('RenewLeaseController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwtFactory: JwtFactory
	let employeeId: string
	let clientId: string
	let propertyId: string

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
	})

	afterEach(async () => {
		await prisma.payment.deleteMany({ where: { lease: { propertyId } } })
		await prisma.lease.deleteMany({ where: { propertyId } })
	})

	afterAll(async () => {
		await prisma.property.deleteMany({ where: { id: propertyId } })
		await app.close()
	})

	it('[POST] /leases/:id/renew - should renew an ACTIVE lease', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		const originalLease = await prisma.lease.create({
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

		const response = await request(app.getHttpServer())
			.post(`/leases/${originalLease.id}/renew`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				startDate: '2025-01-01',
				endDate: '2025-12-31',
				monthlyRent: 1600,
				securityDeposit: 3200,
			})
			.expect(201)

		expect(response.body.data).toBeDefined()
		expect(response.body.data.renewedFromLeaseId).toBe(originalLease.id)
	})

	it('[POST] /leases/:id/renew - should return 400 for PENDING lease (invalid source)', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		const pendingLease = await prisma.lease.create({
			data: {
				id: faker.string.uuid(),
				propertyId,
				tenantId: clientId,
				startDate: new Date('2025-06-01'),
				endDate: new Date('2026-05-31'),
				monthlyRent: 1500,
				securityDeposit: 3000,
				status: 'PENDING',
				createdAt: new Date(),
			},
		})

		await request(app.getHttpServer())
			.post(`/leases/${pendingLease.id}/renew`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				startDate: '2026-06-01',
				endDate: '2027-05-31',
				monthlyRent: 1600,
				securityDeposit: 3200,
			})
			.expect(400)
	})

	it('[POST] /leases/:id/renew - should return 404 for non-existent lease', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		await request(app.getHttpServer())
			.post(`/leases/${faker.string.uuid()}/renew`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				startDate: '2025-01-01',
				endDate: '2025-12-31',
				monthlyRent: 1600,
				securityDeposit: 3200,
			})
			.expect(404)
	})
})
