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

describe('DeletePropertyController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwtFactory: JwtFactory
	let employeeId: string
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
	})

	afterAll(async () => {
		await app.close()
	})

	it('[DELETE] /properties/:id - should delete property with no active lease', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		const property = await prisma.property.create({
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
			.delete(`/properties/${property.id}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(204)

		const deleted = await prisma.property.findUnique({
			where: { id: property.id },
		})
		expect(deleted).toBeNull()
	})

	it('[DELETE] /properties/:id - should return 409 when property has active lease', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

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

		const lease = await prisma.lease.create({
			data: {
				id: faker.string.uuid(),
				propertyId: property.id,
				tenantId: clientId,
				startDate: new Date('2024-01-01'),
				endDate: new Date('2024-12-31'),
				monthlyRent: 1200,
				securityDeposit: 2400,
				status: 'ACTIVE',
				createdAt: new Date(),
			},
		})

		await request(app.getHttpServer())
			.delete(`/properties/${property.id}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(409)

		await prisma.lease.delete({ where: { id: lease.id } })
		await prisma.property.delete({ where: { id: property.id } })
	})

	it('[DELETE] /properties/:id - should return 404 for non-existent property', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		await request(app.getHttpServer())
			.delete(`/properties/${faker.string.uuid()}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(404)
	})
})
