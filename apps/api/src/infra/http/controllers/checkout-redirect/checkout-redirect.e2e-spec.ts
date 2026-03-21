import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('CheckoutRedirectController (E2E)', () => {
	let app: INestApplication

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)
		const moduleRef = await Test.createTestingModule({
			imports: [DatabaseModule, BetterAuthModule, EnvModule, testAppModule],
		}).compile()

		app = moduleRef.createNestApplication()

		await app.init()
	})

	afterAll(async () => {
		await app.close()
	})

	it('[GET] /payments/checkout/success - should return success HTML page', async () => {
		const response = await request(app.getHttpServer())
			.get('/payments/checkout/success')
			.expect(200)

		expect(response.headers['content-type']).toMatch(/text\/html/)
		expect(response.text).toContain('Payment Successful')
	})

	it('[GET] /payments/checkout/cancel - should return cancel HTML page', async () => {
		const response = await request(app.getHttpServer())
			.get('/payments/checkout/cancel')
			.expect(200)

		expect(response.headers['content-type']).toMatch(/text\/html/)
		expect(response.text).toContain('Payment Cancelled')
	})
})
