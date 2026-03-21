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

describe('ExportExpensesCsvController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwtFactory: JwtFactory
	let employeeId: string
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

		const property = await prisma.property.create({
			data: {
				id: faker.string.uuid(),
				managerId: employeeId,
				address: '456 Expense Export Ave',
				city: faker.location.city(),
				state: faker.location.state({ abbreviated: true }),
				zipCode: faker.location.zipCode(),
				propertyType: 'HOUSE',
				bedrooms: 3,
				bathrooms: 2,
				rentAmount: 2000,
				status: 'OCCUPIED',
				createdAt: new Date(),
			},
		})
		propertyId = property.id
	})

	afterEach(async () => {
		await prisma.expense.deleteMany({ where: { propertyId } })
	})

	afterAll(async () => {
		await prisma.property.deleteMany({ where: { id: propertyId } })
		await app.close()
	})

	it('[GET] /expenses/export - should return CSV with correct headers', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		await prisma.expense.create({
			data: {
				id: faker.string.uuid(),
				propertyId,
				managerId: employeeId,
				category: 'MAINTENANCE',
				amount: 500,
				description: 'Roof repair',
				expenseDate: new Date('2025-03-01'),
				createdAt: new Date(),
			},
		})

		const response = await request(app.getHttpServer())
			.get('/expenses/export')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.headers['content-type']).toMatch(/text\/csv/)
		expect(response.text).toContain(
			'Date,Property Address,Category,Amount,Description,Vendor',
		)
		expect(response.text).toContain('456 Expense Export Ave')
		expect(response.text).toContain('Maintenance')
	})

	it('[GET] /expenses/export?category=MAINTENANCE - should only include MAINTENANCE expenses', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		await prisma.expense.create({
			data: {
				id: faker.string.uuid(),
				propertyId,
				managerId: employeeId,
				category: 'MAINTENANCE',
				amount: 300,
				description: 'Pipe fix',
				expenseDate: new Date('2025-03-01'),
				createdAt: new Date(),
			},
		})

		await prisma.expense.create({
			data: {
				id: faker.string.uuid(),
				propertyId,
				managerId: employeeId,
				category: 'INSURANCE',
				amount: 1200,
				description: 'Annual insurance',
				expenseDate: new Date('2025-03-01'),
				createdAt: new Date(),
			},
		})

		const response = await request(app.getHttpServer())
			.get('/expenses/export?category=MAINTENANCE')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		const lines = response.text.split('\n')
		// header + 1 MAINTENANCE row
		expect(lines.length).toBe(2)
		expect(lines[1]).toContain('Maintenance')
	})

	it('[GET] /expenses/export - should return 403 for CLIENT users', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		await request(app.getHttpServer())
			.get('/expenses/export')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(403)
	})
})
