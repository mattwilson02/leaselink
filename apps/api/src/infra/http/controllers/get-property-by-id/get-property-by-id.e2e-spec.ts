import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { faker } from '@faker-js/faker'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { authUserEmployerIdE2E } from 'test/utils/auth-user-id-e2e'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('GetPropertyByIdController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwtFactory: JwtFactory
	let employeeId: string

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
	})

	afterAll(async () => {
		await app.close()
	})

	it('[GET] /properties/:id - should return property when found', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		const property = await prisma.property.create({
			data: {
				id: faker.string.uuid(),
				managerId: employeeId,
				address: faker.location.streetAddress(),
				city: faker.location.city(),
				state: faker.location.state({ abbreviated: true }),
				zipCode: faker.location.zipCode(),
				propertyType: 'HOUSE',
				bedrooms: 3,
				bathrooms: 2,
				rentAmount: 2000,
				status: 'VACANT',
				createdAt: new Date(),
			},
		})

		const response = await request(app.getHttpServer())
			.get(`/properties/${property.id}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body.property).toBeDefined()
		expect(response.body.property.id).toBe(property.id)
		expect(response.body.property.bedrooms).toBe(3)

		await prisma.property.delete({ where: { id: property.id } })
	})

	it('[GET] /properties/:id - should return 404 when property not found', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		await request(app.getHttpServer())
			.get(`/properties/${faker.string.uuid()}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(404)
	})

	it('[GET] /properties/:id - should reject CLIENT auth', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		await request(app.getHttpServer())
			.get(`/properties/${faker.string.uuid()}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(403)
	})
})
