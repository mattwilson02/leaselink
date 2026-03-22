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

describe('CreateMaintenanceRequestController (E2E)', () => {
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
				rentAmount: 1200,
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
				monthlyRent: 1200,
				securityDeposit: 2400,
				status: 'ACTIVE',
				createdAt: new Date(),
			},
		})
		leaseId = lease.id
	})

	afterEach(async () => {
		await prisma.maintenanceRequest.deleteMany({ where: { propertyId } })
	})

	afterAll(async () => {
		await prisma.lease.deleteMany({ where: { id: leaseId } })
		await prisma.property.deleteMany({ where: { id: propertyId } })
		await app.close()
	})

	it('[POST] /maintenance-requests - should create request for CLIENT with active lease', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		const response = await request(app.getHttpServer())
			.post('/maintenance-requests')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				propertyId,
				title: 'Leaking faucet',
				description: 'The kitchen faucet is leaking',
				category: 'PLUMBING',
				priority: 'MEDIUM',
			})
			.expect(201)

		expect(response.body.maintenanceRequest).toBeDefined()
		expect(response.body.maintenanceRequest.propertyId).toBe(propertyId)
		expect(response.body.maintenanceRequest.status).toBe('OPEN')
		expect(response.body.maintenanceRequest.category).toBe('PLUMBING')
	})

	it('[POST] /maintenance-requests - should return 400 when CLIENT has no active lease', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		// Create a different property where this client has no active lease
		const otherProperty = await prisma.property.create({
			data: {
				id: faker.string.uuid(),
				managerId: employeeId,
				address: faker.location.streetAddress(),
				city: faker.location.city(),
				state: faker.location.state({ abbreviated: true }),
				zipCode: faker.location.zipCode(),
				propertyType: 'APARTMENT',
				bedrooms: 1,
				bathrooms: 1,
				rentAmount: 800,
				status: 'VACANT',
				createdAt: new Date(),
			},
		})

		await request(app.getHttpServer())
			.post('/maintenance-requests')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				propertyId: otherProperty.id,
				title: 'Broken window',
				description: 'Window is cracked',
				category: 'STRUCTURAL',
				priority: 'HIGH',
			})
			.expect(400)

		await prisma.property.delete({ where: { id: otherProperty.id } })
	})

	it('[POST] /maintenance-requests - should reject EMPLOYEE auth', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		await request(app.getHttpServer())
			.post('/maintenance-requests')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				propertyId,
				title: 'Test',
				description: 'Test',
				category: 'PLUMBING',
			})
			.expect(401)
	})
})
