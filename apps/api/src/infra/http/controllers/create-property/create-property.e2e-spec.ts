import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { faker } from '@faker-js/faker'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('CreatePropertyController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwtFactory: JwtFactory

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
	})

	afterAll(async () => {
		await app.close()
	})

	it('[POST] /properties - should create a property with valid data', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		const body = {
			address: faker.location.streetAddress(),
			city: faker.location.city(),
			state: faker.location.state({ abbreviated: true }),
			zipCode: faker.location.zipCode(),
			propertyType: 'APARTMENT',
			bedrooms: 2,
			bathrooms: 1,
			rentAmount: 1200,
		}

		const response = await request(app.getHttpServer())
			.post('/properties')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send(body)
			.expect(201)

		expect(response.body.property).toBeDefined()
		expect(response.body.property.address).toBe(body.address)
		expect(response.body.property.propertyType).toBe('APARTMENT')
		expect(response.body.property.status).toBe('VACANT')

		await prisma.property.delete({ where: { id: response.body.property.id } })
	})

	it('[POST] /properties - should return 400 for missing required fields', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		await request(app.getHttpServer())
			.post('/properties')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				address: faker.location.streetAddress(),
				// missing city, state, zipCode, propertyType, bedrooms, bathrooms, rentAmount
			})
			.expect(400)
	})

	it('[POST] /properties - should reject CLIENT auth', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		await request(app.getHttpServer())
			.post('/properties')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				address: faker.location.streetAddress(),
				city: faker.location.city(),
				state: 'CA',
				zipCode: '90210',
				propertyType: 'APARTMENT',
				bedrooms: 2,
				bathrooms: 1,
				rentAmount: 1200,
			})
			.expect(403)
	})
})
