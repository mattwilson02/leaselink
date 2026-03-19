import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { faker } from '@faker-js/faker'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('GetHasUnreadNotificationsController (E2E)', () => {
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

	it('[GET] /notifications/has-unread', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const person = await prisma.employee.create({
			data: {
				id: faker.string.uuid(),
				name: faker.person.fullName(),
				email: faker.internet.email(),
			},
		})

		await prisma.notification.createMany({
			data: [
				{
					id: faker.string.uuid(),
					personId: person.id,
					title: 'Test Notification 1',
					body: '',
					isRead: false,
					notificationType: 'INFO',
				},
				{
					id: faker.string.uuid(),
					personId: person.id,
					title: 'Test Notification 2',
					body: '',
					isRead: false,
					notificationType: 'INFO',
				},
			],
		})

		const response = await request(app.getHttpServer())
			.get('/has-notifications-unread')
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.query({ offset: 0, limit: 10 })
			.expect(200)

		expect(response.body).toBeDefined()
		expect(response.body.hasUnreadNotifications).toBeDefined()
		expect(typeof response.body.hasUnreadNotifications).toBe('boolean')
	})
})
