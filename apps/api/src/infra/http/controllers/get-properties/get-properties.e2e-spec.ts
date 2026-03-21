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

describe('GetPropertiesController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwtFactory: JwtFactory
	let employeeId: string
	let createdPropertyIds: string[] = []

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

	afterEach(async () => {
		if (createdPropertyIds.length > 0) {
			await prisma.property.deleteMany({
				where: { id: { in: createdPropertyIds } },
			})
			createdPropertyIds = []
		}
	})

	afterAll(async () => {
		await app.close()
	})

	it('[GET] /properties - should return paginated properties for EMPLOYEE', async () => {
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
				rentAmount: 1500,
				status: 'VACANT',
				createdAt: new Date(),
			},
		})
		createdPropertyIds.push(property.id)

		const response = await request(app.getHttpServer())
			.get('/properties')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body.data).toBeDefined()
		expect(Array.isArray(response.body.data)).toBe(true)
		expect(response.body.meta).toBeDefined()
		expect(response.body.meta.page).toBe(1)
		expect(typeof response.body.meta.totalCount).toBe('number')
	})

	it('[GET] /properties?status=VACANT - should filter by status', async () => {
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
		createdPropertyIds.push(property.id)

		const response = await request(app.getHttpServer())
			.get('/properties?status=VACANT')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(Array.isArray(response.body.data)).toBe(true)
		// biome-ignore lint/suspicious/noExplicitAny: test assertion
		response.body.data.forEach((p: any) => {
			expect(p.status).toBe('VACANT')
		})
	})

	it('[GET] /properties - should reject CLIENT auth', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		await request(app.getHttpServer())
			.get('/properties')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(403)
	})
})
