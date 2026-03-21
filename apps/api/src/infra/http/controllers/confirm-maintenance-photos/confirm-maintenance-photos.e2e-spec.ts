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

describe('ConfirmMaintenancePhotosController (E2E)', () => {
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
				status: 'OCCUPIED',
				createdAt: new Date(),
			},
		})
		propertyId = property.id
	})

	afterEach(async () => {
		await prisma.maintenanceRequest.deleteMany({ where: { propertyId } })
	})

	afterAll(async () => {
		await prisma.property.deleteMany({ where: { id: propertyId } })
		await app.close()
	})

	it('[POST] /maintenance-requests/:id/photos/confirm - should confirm photos for CLIENT', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		const maintenanceRequest = await prisma.maintenanceRequest.create({
			data: {
				id: faker.string.uuid(),
				propertyId,
				tenantId: clientId,
				title: 'Mold on wall',
				description: 'Black mold spotted',
				category: 'STRUCTURAL',
				priority: 'HIGH',
				status: 'OPEN',
				createdAt: new Date(),
			},
		})

		const response = await request(app.getHttpServer())
			.post(`/maintenance-requests/${maintenanceRequest.id}/photos/confirm`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				blobKeys: ['maintenance-photos/test-blob-key.jpg'],
			})
			.expect(200)

		expect(response.body.maintenanceRequest).toBeDefined()
		expect(Array.isArray(response.body.maintenanceRequest.photos)).toBe(true)
	})

	it('[POST] /maintenance-requests/:id/photos/confirm - should return 404 for non-existent request', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		await request(app.getHttpServer())
			.post(`/maintenance-requests/${faker.string.uuid()}/photos/confirm`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				blobKeys: ['test-blob-key.jpg'],
			})
			.expect(404)
	})

	it('[POST] /maintenance-requests/:id/photos/confirm - should reject EMPLOYEE auth', async () => {
		const { jwt } = await jwtFactory.makeJwt(false)

		await request(app.getHttpServer())
			.post(`/maintenance-requests/${faker.string.uuid()}/photos/confirm`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				blobKeys: ['test-blob-key.jpg'],
			})
			.expect(401)
	})
})
