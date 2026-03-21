import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { createTestAppModule } from 'test/utils/test-app.module'

/**
 * Stripe webhook tests are limited since they require a valid Stripe signature.
 * The controller always returns { received: true } (status 200) even on error,
 * so we can verify the endpoint is reachable and returns the expected shape.
 */
describe('StripeWebhookController (E2E)', () => {
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

	it('[POST] /payments/webhook - should return { received: true } even without valid Stripe signature', async () => {
		// Without a valid Stripe signature, constructWebhookEvent throws,
		// but the controller catches all errors and always returns { received: true }
		const response = await request(app.getHttpServer())
			.post('/payments/webhook')
			.set({
				'stripe-signature': 'invalid-signature',
				'content-type': 'application/json',
			})
			.send(JSON.stringify({ type: 'checkout.session.completed' }))
			.expect(200)

		expect(response.body).toEqual({ received: true })
	})

	it('[POST] /payments/webhook - should return { received: true } with no body or signature', async () => {
		const response = await request(app.getHttpServer())
			.post('/payments/webhook')
			.expect(200)

		expect(response.body).toEqual({ received: true })
	})
})
