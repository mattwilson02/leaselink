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

describe('CreateLeaseController (E2E)', () => {
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
				status: 'VACANT',
				createdAt: new Date(),
			},
		})
		propertyId = property.id
	})

	afterEach(async () => {
		await prisma.payment.deleteMany({ where: { lease: { propertyId } } })
		await prisma.lease.deleteMany({ where: { propertyId } })
		await prisma.property.update({
			where: { id: propertyId },
			data: { status: 'VACANT' },
		})
	})

	afterAll(async () => {
		await prisma.property.deleteMany({ where: { id: propertyId } })
		await app.close()
	})

	it('[POST] /leases - should create lease with valid data', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		const response = await request(app.getHttpServer())
			.post('/leases')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				propertyId,
				tenantId: clientId,
				startDate: '2027-01-01',
				endDate: '2027-12-31',
				monthlyRent: 1500,
				securityDeposit: 3000,
			})
			.expect(201)

		expect(response.body.data).toBeDefined()
		expect(response.body.data.propertyId).toBe(propertyId)
		expect(response.body.data.tenantId).toBe(clientId)
		expect(response.body.data.status).toBe('PENDING')
	})

	it('[POST] /leases - should return 404 for non-existent property', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		await request(app.getHttpServer())
			.post('/leases')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				propertyId: faker.string.uuid(),
				tenantId: clientId,
				startDate: '2027-01-01',
				endDate: '2027-12-31',
				monthlyRent: 1500,
				securityDeposit: 3000,
			})
			.expect(404)
	})

	it('[POST] /leases - should return 400 for property not available for leasing', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		// Create a property with OCCUPIED status (not VACANT or LISTED)
		const occupiedProperty = await prisma.property.create({
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

		await request(app.getHttpServer())
			.post('/leases')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				propertyId: occupiedProperty.id,
				tenantId: clientId,
				startDate: '2027-01-01',
				endDate: '2027-12-31',
				monthlyRent: 1500,
				securityDeposit: 3000,
			})
			.expect(400)

		await prisma.property.delete({ where: { id: occupiedProperty.id } })
	})

	it('[POST] /leases - should reject CLIENT auth', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		await request(app.getHttpServer())
			.post('/leases')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				propertyId,
				tenantId: clientId,
				startDate: '2027-01-01',
				endDate: '2027-12-31',
				monthlyRent: 1500,
				securityDeposit: 3000,
			})
			.expect(403)
	})
})
