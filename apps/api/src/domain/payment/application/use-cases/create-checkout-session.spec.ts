import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeLease } from 'test/factories/make-lease'
import { makePayment } from 'test/factories/make-payment'
import { makeProperty } from 'test/factories/make-property'
import { InMemoryLeasesRepository } from 'test/repositories/prisma/in-memory-leases-repository'
import { InMemoryPaymentsRepository } from 'test/repositories/prisma/in-memory-payments-repository'
import { InMemoryPropertiesRepository } from 'test/repositories/prisma/in-memory-properties-repository'
import { LeaseStatus } from '@/domain/lease-management/enterprise/entities/value-objects/lease-status'
import { PaymentStatus } from '../../enterprise/entities/value-objects/payment-status'
import { CreateCheckoutSessionUseCase } from './create-checkout-session'
import { PaymentAlreadyPaidError } from './errors/payment-already-paid-error'
import { PaymentNotFoundError } from './errors/payment-not-found-error'
import { PaymentNotPayableError } from './errors/payment-not-payable-error'
import type { StripeService } from '../stripe/stripe-service'
import { right } from '@/core/either'

class MockStripeService implements StripeService {
	calls: any[] = []

	async createCheckoutSession(params: any) {
		this.calls.push(params)
		return {
			sessionId: 'cs_test_session_123',
			url: 'https://checkout.stripe.com/pay/cs_test_session_123',
		}
	}
}

let inMemoryPaymentsRepository: InMemoryPaymentsRepository
let inMemoryLeasesRepository: InMemoryLeasesRepository
let inMemoryPropertiesRepository: InMemoryPropertiesRepository
let mockStripeService: MockStripeService
let sut: CreateCheckoutSessionUseCase

describe('CreateCheckoutSession', () => {
	beforeEach(() => {
		inMemoryPaymentsRepository = new InMemoryPaymentsRepository()
		inMemoryLeasesRepository = new InMemoryLeasesRepository()
		inMemoryPropertiesRepository = new InMemoryPropertiesRepository()
		mockStripeService = new MockStripeService()

		sut = new CreateCheckoutSessionUseCase(
			inMemoryPaymentsRepository,
			inMemoryLeasesRepository,
			inMemoryPropertiesRepository,
			mockStripeService as unknown as StripeService,
		)
	})

	it('should create session for PENDING payment', async () => {
		const tenantId = new UniqueEntityId('tenant-1')
		const payment = makePayment({
			tenantId,
			status: PaymentStatus.create('PENDING'),
		})
		await inMemoryPaymentsRepository.create(payment)

		const result = await sut.execute({
			paymentId: payment.id.toString(),
			tenantId: 'tenant-1',
			successUrl: 'leaselink://payment-success',
			cancelUrl: 'leaselink://payment-cancel',
		})

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.url).toBe(
				'https://checkout.stripe.com/pay/cs_test_session_123',
			)
		}
	})

	it('should create session for OVERDUE payment', async () => {
		const tenantId = new UniqueEntityId('tenant-1')
		const payment = makePayment({
			tenantId,
			status: PaymentStatus.create('OVERDUE'),
		})
		await inMemoryPaymentsRepository.create(payment)

		const result = await sut.execute({
			paymentId: payment.id.toString(),
			tenantId: 'tenant-1',
			successUrl: 'leaselink://payment-success',
			cancelUrl: 'leaselink://payment-cancel',
		})

		expect(result.isRight()).toBe(true)
	})

	it('should reject if payment is already PAID', async () => {
		const tenantId = new UniqueEntityId('tenant-1')
		const payment = makePayment({
			tenantId,
			status: PaymentStatus.create('PAID'),
		})
		await inMemoryPaymentsRepository.create(payment)

		const result = await sut.execute({
			paymentId: payment.id.toString(),
			tenantId: 'tenant-1',
			successUrl: 'leaselink://payment-success',
			cancelUrl: 'leaselink://payment-cancel',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(PaymentAlreadyPaidError)
	})

	it('should reject if payment is UPCOMING', async () => {
		const tenantId = new UniqueEntityId('tenant-1')
		const payment = makePayment({
			tenantId,
			status: PaymentStatus.create('UPCOMING'),
		})
		await inMemoryPaymentsRepository.create(payment)

		const result = await sut.execute({
			paymentId: payment.id.toString(),
			tenantId: 'tenant-1',
			successUrl: 'leaselink://payment-success',
			cancelUrl: 'leaselink://payment-cancel',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(PaymentNotPayableError)
	})

	it("should reject if tenant doesn't own payment", async () => {
		const payment = makePayment({
			tenantId: new UniqueEntityId('other-tenant'),
			status: PaymentStatus.create('PENDING'),
		})
		await inMemoryPaymentsRepository.create(payment)

		const result = await sut.execute({
			paymentId: payment.id.toString(),
			tenantId: 'tenant-1',
			successUrl: 'leaselink://payment-success',
			cancelUrl: 'leaselink://payment-cancel',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(PaymentNotFoundError)
	})

	it('should store stripeCheckoutSessionId on payment', async () => {
		const tenantId = new UniqueEntityId('tenant-1')
		const payment = makePayment({
			tenantId,
			status: PaymentStatus.create('PENDING'),
		})
		await inMemoryPaymentsRepository.create(payment)

		await sut.execute({
			paymentId: payment.id.toString(),
			tenantId: 'tenant-1',
			successUrl: 'leaselink://payment-success',
			cancelUrl: 'leaselink://payment-cancel',
		})

		const updated = await inMemoryPaymentsRepository.findById(
			payment.id.toString(),
		)
		expect(updated?.stripeCheckoutSessionId).toBe('cs_test_session_123')
	})
})
