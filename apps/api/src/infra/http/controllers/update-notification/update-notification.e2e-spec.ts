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

describe('UpdateNotificationController (E2E)', () => {
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

	afterEach(async () => {
		await prisma.notification.deleteMany()
	})

	it('[PATCH] /notifications/:id - should update a notification and return presenter format', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const notification = await prisma.notification.create({
			data: {
				id: faker.string.uuid(),
				personId: faker.string.uuid(),
				text: 'Original notification',
				notificationType: 'ACTION',
				actionType: 'BASIC_COMPLETE',
				isRead: false,
				isActionComplete: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		})

		const payload = {
			isRead: true,
			isActionComplete: true,
		}

		const response = await request(app.getHttpServer())
			.patch(`/notifications/${notification.id}`)
			// biome-ignore lint/style/useNamingConvention: <Intentional>
			.set({ Authorization: `Bearer ${jwt}` })
			.send(payload)

		expect(response.status).toBe(200)
		expect(response.body).toMatchObject({
			notificationId: notification.id,
			isRead: true,
			isActionComplete: true,
			text: 'Original notification',
			notificationType: 'ACTION',
			actionType: 'BASIC_COMPLETE',
			archivedAt: null,
			linkedDocumentId: null,
			linkedTransactionId: null,
			createdAt: expect.any(String),
			updatedAt: expect.any(String),
		})
	})

	it('[PATCH] /notifications/:id should return 422 if notification action is incomplete and you try to archive it', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const notification = await prisma.notification.create({
			data: {
				id: faker.string.uuid(),
				personId: faker.string.uuid(),
				text: 'Original notification',
				notificationType: 'ACTION',
				actionType: 'BASIC_COMPLETE',
				isRead: false,
				isActionComplete: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		})

		const response = await request(app.getHttpServer())
			.patch(`/notifications/${notification.id}`)
			// biome-ignore lint/style/useNamingConvention: <Intentional>
			.set({ Authorization: `Bearer ${jwt}` })
			.send({ isArchived: true })

		expect(response.status).toBe(422)
	})

	it('[PATCH] /notifications/:id should return 422 if action_type is not basic complete', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const notification = await prisma.notification.create({
			data: {
				id: faker.string.uuid(),
				personId: faker.string.uuid(),
				text: 'Original notification',
				notificationType: 'ACTION',
				actionType: 'SIGN_DOCUMENT',
				isRead: false,
				isActionComplete: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		})

		const response = await request(app.getHttpServer())
			.patch(`/notifications/${notification.id}`)
			// biome-ignore lint/style/useNamingConvention: <Intentional>
			.set({ Authorization: `Bearer ${jwt}` })
			.send({ isActionComplete: true })

		expect(response.status).toBe(422)
	})

	it('[PATCH] /notifications/:id - should return 404 if notification not found', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const response = await request(app.getHttpServer())
			.patch(`/notifications/${faker.string.uuid()}`)
			// biome-ignore lint/style/useNamingConvention: <Intentional>
			.set({ Authorization: `Bearer ${jwt}` })
			.send({ isRead: true })

		expect(response.status).toBe(404)
		expect(response.body.message).toContain('not found')
	})

	it('[PATCH] /notifications/:id - should return 400 for invalid body', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const response = await request(app.getHttpServer())
			.patch(`/notifications/${faker.string.uuid()}`)
			// biome-ignore lint/style/useNamingConvention: <Intentional>
			.set({ Authorization: `Bearer ${jwt}` })
			.send({
				isRead: 'yes', // ❌ should be boolean
				isActionComplete: 123,
			})

		expect(response.status).toBe(400)
		expect(response.body.message).toBeDefined()
	})
})
