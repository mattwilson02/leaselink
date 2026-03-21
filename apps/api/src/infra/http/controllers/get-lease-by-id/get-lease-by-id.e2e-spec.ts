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

describe('GetLeaseByIdController (E2E)', () => {
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
				rentAmount: 1200,
				status: 'VACANT',
				createdAt: new Date(),
			},
		})
		propertyId = property.id
	})

	afterAll(async () => {
		await prisma.lease.deleteMany({ where: { propertyId } })
		await prisma.property.deleteMany({ where: { id: propertyId } })
		await app.close()
	})

	it('[GET] /leases/:id - should return lease when found', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		const lease = await prisma.lease.create({
			data: {
				id: faker.string.uuid(),
				propertyId,
				tenantId: clientId,
				startDate: new Date('2024-01-01'),
				endDate: new Date('2024-12-31'),
				monthlyRent: 1200,
				securityDeposit: 2400,
				status: 'PENDING',
				createdAt: new Date(),
			},
		})

		const response = await request(app.getHttpServer())
			.get(`/leases/${lease.id}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body.data).toBeDefined()
		expect(response.body.data.id).toBe(lease.id)
		expect(response.body.data.propertyId).toBe(propertyId)
		expect(response.body.data.status).toBe('PENDING')

		await prisma.lease.delete({ where: { id: lease.id } })
	})

	it('[GET] /leases/:id - should return 404 when lease not found', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		await request(app.getHttpServer())
			.get(`/leases/${faker.string.uuid()}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(404)
	})

	it('[GET] /leases/:id - should reject CLIENT auth', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		await request(app.getHttpServer())
			.get(`/leases/${faker.string.uuid()}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(403)
	})
})
