import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeLease } from 'test/factories/make-lease'
import { makePayment } from 'test/factories/make-payment'
import { makeProperty } from 'test/factories/make-property'
import { InMemoryLeasesRepository } from 'test/repositories/prisma/in-memory-leases-repository'
import { InMemoryPaymentsRepository } from 'test/repositories/prisma/in-memory-payments-repository'
import { InMemoryPropertiesRepository } from 'test/repositories/prisma/in-memory-properties-repository'
import { LeaseStatus } from '@/domain/lease-management/enterprise/entities/value-objects/lease-status'
import { PaymentStatus } from '../../enterprise/entities/value-objects/payment-status'
import { HandleCheckoutCompletedUseCase } from './handle-checkout-completed'
import { PaymentNotFoundError } from './errors/payment-not-found-error'
import type { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import { right } from '@/core/either'

class MockCreateNotificationUseCase {
	calls: any[] = []

	async execute(input: any) {
		this.calls.push(input)
		return right({ notification: {} as any })
	}
}

let inMemoryPaymentsRepository: InMemoryPaymentsRepository
let inMemoryLeasesRepository: InMemoryLeasesRepository
let inMemoryPropertiesRepository: InMemoryPropertiesRepository
let mockCreateNotification: MockCreateNotificationUseCase
let sut: HandleCheckoutCompletedUseCase

describe('HandleCheckoutCompleted', () => {
	beforeEach(() => {
		inMemoryPaymentsRepository = new InMemoryPaymentsRepository()
		inMemoryLeasesRepository = new InMemoryLeasesRepository()
		inMemoryPropertiesRepository = new InMemoryPropertiesRepository()
		mockCreateNotification = new MockCreateNotificationUseCase()

		sut = new HandleCheckoutCompletedUseCase(
			inMemoryPaymentsRepository,
			inMemoryLeasesRepository,
			inMemoryPropertiesRepository,
			mockCreateNotification as unknown as CreateNotificationUseCase,
		)
	})

	it('should mark payment as PAID', async () => {
		const payment = makePayment({
			status: PaymentStatus.create('PENDING'),
			stripeCheckoutSessionId: 'cs_test_abc',
		})
		await inMemoryPaymentsRepository.create(payment)

		const result = await sut.execute({
			stripeSessionId: 'cs_test_abc',
			stripePaymentIntentId: 'pi_test_xyz',
		})

		expect(result.isRight()).toBe(true)
		const updated = await inMemoryPaymentsRepository.findById(
			payment.id.toString(),
		)
		expect(updated?.status).toBe('PAID')
		expect(updated?.paidAt).toBeInstanceOf(Date)
	})

	it('should store stripePaymentIntentId', async () => {
		const payment = makePayment({
			status: PaymentStatus.create('PENDING'),
			stripeCheckoutSessionId: 'cs_test_abc',
		})
		await inMemoryPaymentsRepository.create(payment)

		await sut.execute({
			stripeSessionId: 'cs_test_abc',
			stripePaymentIntentId: 'pi_test_xyz',
		})

		const updated = await inMemoryPaymentsRepository.findById(
			payment.id.toString(),
		)
		expect(updated?.stripePaymentIntentId).toBe('pi_test_xyz')
	})

	it('should be idempotent — calling twice succeeds', async () => {
		const payment = makePayment({
			status: PaymentStatus.create('PENDING'),
			stripeCheckoutSessionId: 'cs_test_abc',
		})
		await inMemoryPaymentsRepository.create(payment)

		await sut.execute({
			stripeSessionId: 'cs_test_abc',
			stripePaymentIntentId: 'pi_test_xyz',
		})

		const result = await sut.execute({
			stripeSessionId: 'cs_test_abc',
			stripePaymentIntentId: 'pi_test_xyz',
		})

		expect(result.isRight()).toBe(true)
	})

	it('should send PAYMENT_RECEIVED notification to manager', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const property = makeProperty({ managerId })
		await inMemoryPropertiesRepository.create(property)

		const lease = makeLease({
			propertyId: property.id,
			status: LeaseStatus.create('ACTIVE'),
		})
		await inMemoryLeasesRepository.create(lease)

		const payment = makePayment({
			leaseId: lease.id,
			tenantId: lease.tenantId,
			status: PaymentStatus.create('PENDING'),
			stripeCheckoutSessionId: 'cs_test_abc',
		})
		await inMemoryPaymentsRepository.create(payment)

		await sut.execute({
			stripeSessionId: 'cs_test_abc',
			stripePaymentIntentId: 'pi_test_xyz',
		})

		expect(mockCreateNotification.calls).toHaveLength(1)
		expect(mockCreateNotification.calls[0].personId).toBe('manager-1')
		expect(mockCreateNotification.calls[0].actionType).toBe('PAYMENT_RECEIVED')
	})

	it('should return error for unknown session ID', async () => {
		const result = await sut.execute({
			stripeSessionId: 'cs_test_unknown',
			stripePaymentIntentId: 'pi_test_xyz',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(PaymentNotFoundError)
	})
})
