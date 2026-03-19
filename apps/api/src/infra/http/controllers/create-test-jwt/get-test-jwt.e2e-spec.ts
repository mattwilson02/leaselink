import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ClientFactory } from 'test/factories/make-client'
import { ClientWithValidSessionAndJwtFactory } from 'test/factories/make-client-with-valid-session-and-jwt-factory'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('GetTestJwtController (E2E)', () => {
	let app: INestApplication

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)
		const moduleRef = await Test.createTestingModule({
			imports: [DatabaseModule, BetterAuthModule, EnvModule, testAppModule],
			providers: [ClientFactory, ClientWithValidSessionAndJwtFactory],
		}).compile()

		app = moduleRef.createNestApplication()

		await app.init()
	})

	it('[GET] /token/generate/employee', async () => {
		const response = await request(app.getHttpServer()).get(
			'/token/generate/employee',
		)

		expect(response.status).toBe(200)
		expect(response.body).toHaveProperty('sessionId')
		expect(response.body).toHaveProperty('token')
		expect(response.body).toEqual(
			expect.objectContaining({
				sessionId: expect.any(String),
				token: expect.any(String),
			}),
		)
	})
})
