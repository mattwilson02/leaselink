import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { faker } from '@faker-js/faker'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { authUserClientIdE2E } from 'test/utils/auth-user-id-e2e'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('GetNotificationsController (E2E)', () => {
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

	it('[GET] /notifications/:personId - should retrieve notifications for a person', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		const oldDate = new Date('2023-01-01T10:00:00.000Z')
		const recentDate = new Date('2023-01-03T10:00:00.000Z')
		const middleDate = new Date('2023-01-02T10:00:00.000Z')

		await prisma.notification.createMany({
			data: [
				{
					id: faker.string.uuid(),
					personId,
					text: 'Old Notification',
					notificationType: 'INFO',
					isRead: false,
					isActionComplete: false,
					createdAt: oldDate,
					updatedAt: new Date(),
				},
				{
					id: faker.string.uuid(),
					personId,
					text: 'Recent Notification',
					notificationType: 'ACTION',
					isRead: true,
					isActionComplete: true,
					createdAt: recentDate,
					updatedAt: new Date(),
				},
				{
					id: faker.string.uuid(),
					personId,
					text: 'Middle Notification',
					notificationType: 'INFO',
					isRead: false,
					isActionComplete: false,
					createdAt: middleDate,
					updatedAt: new Date(),
				},
			],
		})

		const response = await request(app.getHttpServer())
			.get('/notifications')
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.query({ offset: 0, limit: 10 })
			.expect(200)

		expect(response.body).toBeDefined()
		expect(response.body.notifications).toHaveLength(3)
		const notifications = response.body.notifications
		expect(notifications[0]).toEqual(
			expect.objectContaining({
				text: 'Recent Notification',
				isRead: true,
			}),
		)

		expect(notifications[1]).toEqual(
			expect.objectContaining({
				text: 'Middle Notification',
				isRead: false,
			}),
		)

		expect(notifications[2]).toEqual(
			expect.objectContaining({
				text: 'Old Notification',
				isRead: false,
			}),
		)
	})

	it('[GET] /notifications/:personId - should return archived notifications when isArchived=true', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		const archivedDate = new Date('2023-06-01')

		await prisma.notification.createMany({
			data: [
				{
					id: faker.string.uuid(),
					personId,
					text: 'Active Notification',
					notificationType: 'INFO',
					isRead: false,
					isActionComplete: false,
					createdAt: new Date('2023-01-01'),
					updatedAt: new Date(),
					archivedAt: null, // Not archived
				},
				{
					id: faker.string.uuid(),
					personId,
					text: 'Archived Notification 1',
					notificationType: 'ACTION',
					isRead: true,
					isActionComplete: true,
					createdAt: new Date('2023-01-02'),
					updatedAt: new Date(),
					archivedAt: archivedDate, // Archived
				},
				{
					id: faker.string.uuid(),
					personId,
					text: 'Archived Notification 2',
					notificationType: 'INFO',
					isRead: false,
					isActionComplete: false,
					createdAt: new Date('2023-01-03'),
					updatedAt: new Date(),
					archivedAt: archivedDate, // Archived
				},
			],
		})

		const response = await request(app.getHttpServer())
			.get('/notifications')
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.query({ offset: 0, limit: 10, isArchived: 'true' })
			.expect(200)

		expect(response.body).toBeDefined()
		expect(response.body.notifications).toHaveLength(2)
		expect(response.body.notifications).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					text: 'Archived Notification 1',
					isRead: true,
				}),
				expect.objectContaining({
					text: 'Archived Notification 2',
					isRead: false,
				}),
			]),
		)

		// Ensure we only get archived notifications (none with text 'Active Notification')
		const activeNotifications = response.body.notifications.filter(
			(notification: { text: string }) =>
				notification.text === 'Active Notification',
		)
		expect(activeNotifications).toHaveLength(0)
	})

	it('[GET] /notifications/:personId - should return only non-archived notifications when isArchived=false or not provided', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		const archivedDate = new Date('2023-06-01')

		await prisma.notification.createMany({
			data: [
				{
					id: faker.string.uuid(),
					personId,
					text: 'Active Notification 1',
					notificationType: 'INFO',
					isRead: false,
					isActionComplete: false,
					createdAt: new Date('2023-01-01'),
					updatedAt: new Date(),
					archivedAt: null, // Not archived
				},
				{
					id: faker.string.uuid(),
					personId,
					text: 'Active Notification 2',
					notificationType: 'ACTION',
					isRead: true,
					isActionComplete: true,
					createdAt: new Date('2023-01-02'),
					updatedAt: new Date(),
					archivedAt: null, // Not archived
				},
				{
					id: faker.string.uuid(),
					personId,
					text: 'Archived Notification',
					notificationType: 'INFO',
					isRead: false,
					isActionComplete: false,
					createdAt: new Date('2023-01-03'),
					updatedAt: new Date(),
					archivedAt: archivedDate, // Archived
				},
			],
		})

		const response = await request(app.getHttpServer())
			.get('/notifications')
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.query({ offset: 0, limit: 10, isArchived: false })
			.expect(200)

		expect(response.body).toBeDefined()
		expect(response.body.notifications).toHaveLength(2)
		expect(response.body.notifications).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					text: 'Active Notification 1',
					isRead: false,
				}),
				expect.objectContaining({
					text: 'Active Notification 2',
					isRead: true,
				}),
			]),
		)
	})

	it('[GET] /notifications/:personId - should return 204 when no archived notifications exist', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		// Create only non-archived notifications
		await prisma.notification.createMany({
			data: [
				{
					id: faker.string.uuid(),
					personId,
					text: 'Active Notification',
					notificationType: 'INFO',
					isRead: false,
					isActionComplete: false,
					createdAt: new Date('2023-01-01'),
					updatedAt: new Date(),
					archivedAt: null, // Not archived
				},
			],
		})

		await request(app.getHttpServer())
			.get('/notifications')
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.query({ offset: 0, limit: 10, isArchived: 'true' })
			.expect(204) // Should return 204 as there are no archived notifications
	})

	it('[GET] /notifications/:personId - should return 204 if no notifications are found', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		await request(app.getHttpServer())
			.get('/notifications')
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.query({ offset: 0, limit: 10 })
			.expect(204)
	})
})
