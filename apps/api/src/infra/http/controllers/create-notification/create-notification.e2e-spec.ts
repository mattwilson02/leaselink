import { NotificationType } from '@/domain/notification/enterprise/entities/notification'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { faker } from '@faker-js/faker'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('CreateNotificationController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwtFactory: JwtFactory

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)
		const moduleRef = await Test.createTestingModule({
			imports: [BetterAuthModule, EnvModule, testAppModule],
			providers: [JwtFactory],
		}).compile()

		app = moduleRef.createNestApplication()
		jwtFactory = moduleRef.get(JwtFactory)
		prisma = moduleRef.get(PrismaService)

		await app.init()
	})

	it('[POST] /notifications', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const newNotification = {
			personId: faker.string.uuid(),
			text: faker.lorem.sentence(),
			notificationType: NotificationType.INFO,
			actionType: undefined,
			linkedDocumentId: undefined,
			linkedTransactionId: undefined,
		}

		const response = await request(app.getHttpServer())
			.post('/notifications')
			.set({
				// biome-ignore lint/style/useNamingConvention: Authorization header
				Authorization: `Bearer ${jwt}`,
			})
			.send(newNotification)

		expect(response.status).toBe(201)

		await vi.waitFor(async () => {
			const notification = await prisma.notification.findFirst({
				where: {
					personId: newNotification.personId,
				},
			})

			expect(notification).not.toBeFalsy()
		})
	})
})
