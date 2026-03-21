import { StripeWebhookController } from './stripe-webhook.controller'
import { right, left } from '@/core/either'
import type { HandleCheckoutCompletedUseCase } from '@/domain/payment/application/use-cases/handle-checkout-completed'
import type { StripeServiceImpl } from '@/infra/stripe/stripe.service'
import type { PrismaService } from '@/infra/database/prisma/prisma.service'
import type { RawBodyRequest } from '@nestjs/common'
import type { Request } from 'express'

const makeStripeEvent = (overrides: Record<string, unknown> = {}) => ({
	id: 'evt_test_123',
	type: 'checkout.session.completed',
	data: {
		object: {
			id: 'cs_test_session_123',
			payment_intent: 'pi_test_456',
		},
	},
	...overrides,
})

const makeReq = () => ({
	rawBody: Buffer.from('raw-body'),
})

class MockHandleCheckoutCompleted {
	lastCall: unknown = null
	returnValue: unknown = right({})

	async execute(input: unknown) {
		this.lastCall = input
		return this.returnValue
	}
}

class MockStripeService {
	eventToReturn: ReturnType<typeof makeStripeEvent> = makeStripeEvent()
	shouldThrow = false
	throwMessage = 'Invalid signature'

	constructWebhookEvent(_rawBody: Buffer, _signature: string) {
		if (this.shouldThrow) {
			throw new Error(this.throwMessage)
		}
		return this.eventToReturn
	}
}

class MockPrismaService {
	createdWebhooks: unknown[] = []

	failedWebhook = {
		create: async (data: { data: unknown }) => {
			this.createdWebhooks.push(data.data)
			return data.data
		},
	}
}

describe('StripeWebhookController', () => {
	let handleCheckoutCompleted: MockHandleCheckoutCompleted
	let stripeService: MockStripeService
	let prisma: MockPrismaService
	let sut: StripeWebhookController

	beforeEach(() => {
		handleCheckoutCompleted = new MockHandleCheckoutCompleted()
		stripeService = new MockStripeService()
		prisma = new MockPrismaService()
		sut = new StripeWebhookController(
			handleCheckoutCompleted as unknown as HandleCheckoutCompletedUseCase,
			stripeService as unknown as StripeServiceImpl,
			prisma as unknown as PrismaService,
		)
	})

	it('should process checkout.session.completed and return { received: true }', async () => {
		const result = await sut.handle(
			makeReq() as unknown as RawBodyRequest<Request>,
			'sig_test',
		)

		expect(result).toEqual({ received: true })
		expect(handleCheckoutCompleted.lastCall).toMatchObject({
			stripeSessionId: 'cs_test_session_123',
			stripePaymentIntentId: 'pi_test_456',
		})
	})

	it('should return { received: true } when checkout result is left (payment not found)', async () => {
		handleCheckoutCompleted.returnValue = left(new Error('Payment not found'))

		const result = await sut.handle(
			makeReq() as unknown as RawBodyRequest<Request>,
			'sig_test',
		)

		expect(result).toEqual({ received: true })
		expect(prisma.createdWebhooks).toHaveLength(0)
	})

	it('should persist to FailedWebhook and return { received: true } when processing throws', async () => {
		handleCheckoutCompleted.returnValue = Promise.reject(
			new Error('Database connection failed'),
		)

		const result = await sut.handle(
			makeReq() as unknown as RawBodyRequest<Request>,
			'sig_test',
		)

		expect(result).toEqual({ received: true })
		expect(prisma.createdWebhooks).toHaveLength(1)
	})

	it('should persist FailedWebhook with correct eventId, eventType, and errorMessage', async () => {
		const event = makeStripeEvent({
			id: 'evt_failure_abc',
			type: 'checkout.session.completed',
		})
		stripeService.eventToReturn = event
		handleCheckoutCompleted.returnValue = Promise.reject(
			new Error('Unexpected processing error'),
		)

		await sut.handle(
			makeReq() as unknown as RawBodyRequest<Request>,
			'sig_test',
		)

		expect(prisma.createdWebhooks).toHaveLength(1)
		expect(prisma.createdWebhooks[0]).toMatchObject({
			eventId: 'evt_failure_abc',
			eventType: 'checkout.session.completed',
			errorMessage: 'Unexpected processing error',
		})
	})

	it('should return { received: true } when signature verification fails', async () => {
		stripeService.shouldThrow = true

		const result = await sut.handle(
			makeReq() as unknown as RawBodyRequest<Request>,
			'bad_sig',
		)

		expect(result).toEqual({ received: true })
		expect(prisma.createdWebhooks).toHaveLength(0)
	})
})
