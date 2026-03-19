import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { faker } from '@faker-js/faker'
import { authUserClientIdE2E } from 'test/utils/auth-user-id-e2e'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('MarkAllNotificationsAsReadController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwtFactory: JwtFactory
	let personId: string

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

		const clientAuth = await prisma.identityProvider.findFirst({
			where: {
				providerUserId: authUserClientIdE2E,
			},
		})

		if (!clientAuth?.userId) {
			throw new Error('Client user ID not found')
		}

		personId = clientAuth?.userId
	})

	afterEach(async () => {
		await prisma.notification.deleteMany({
			where: {
				personId,
			},
		})
	})

	it('[PATCH] /mark-all-notifications-as-read - should mark all notifications as read for a client', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		await prisma.notification.createMany({
			data: [
				{
					id: faker.string.uuid(),
					personId,
					title: 'Unread Notification 1',
					body: '',
					notificationType: 'INFO',
					isRead: false,
					isActionComplete: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: faker.string.uuid(),
					personId,
					title: 'Unread Notification 2',
					body: '',
					notificationType: 'ACTION',
					isRead: false,
					isActionComplete: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
		})

		const response = await request(app.getHttpServer())
			.patch('/mark-all-notifications-as-read')
			// biome-ignore lint/style/useNamingConvention: <Acceptable>
			.set({ Authorization: `Bearer ${jwt}` })

		expect(response.status).toBe(200)
		expect(response.body).toBeDefined()
		expect(response.body.count).toBe(2)

		// Ensure all notifications are now marked as read
		const updated = await prisma.notification.findMany({ where: { personId } })
		for (const n of updated) {
			expect(n.isRead).toBe(true)
		}
	})
})
