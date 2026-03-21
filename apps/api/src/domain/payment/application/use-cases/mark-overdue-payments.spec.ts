import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makePayment } from 'test/factories/make-payment'
import { InMemoryPaymentsRepository } from 'test/repositories/prisma/in-memory-payments-repository'
import { PaymentStatus } from '../../enterprise/entities/value-objects/payment-status'
import { MarkOverduePaymentsUseCase } from './mark-overdue-payments'
import type { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import { right } from '@/core/either'

class MockCreateNotificationUseCase {
	// biome-ignore lint/suspicious/noExplicitAny: test mock needs property access
	calls: any[] = []

	async execute(input: unknown) {
		this.calls.push(input)
		return right({ notification: {} as unknown })
	}
}

let inMemoryPaymentsRepository: InMemoryPaymentsRepository
let mockCreateNotification: MockCreateNotificationUseCase
let sut: MarkOverduePaymentsUseCase

describe('MarkOverduePayments', () => {
	beforeEach(() => {
		inMemoryPaymentsRepository = new InMemoryPaymentsRepository()
		mockCreateNotification = new MockCreateNotificationUseCase()

		sut = new MarkOverduePaymentsUseCase(
			inMemoryPaymentsRepository,
			mockCreateNotification as unknown as CreateNotificationUseCase,
		)
	})

	it('should mark overdue payments (PENDING, due 6 days ago)', async () => {
		const dueDate = new Date()
		dueDate.setDate(dueDate.getDate() - 6)

		const payment = makePayment({
			status: PaymentStatus.create('PENDING'),
			dueDate,
		})
		await inMemoryPaymentsRepository.create(payment)

		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.overdueCount).toBe(1)
		}

		const updated = await inMemoryPaymentsRepository.findById(
			payment.id.toString(),
		)
		expect(updated?.status).toBe('OVERDUE')
	})

	it('should not mark payment within grace period (due 3 days ago)', async () => {
		const dueDate = new Date()
		dueDate.setDate(dueDate.getDate() - 3)

		const payment = makePayment({
			status: PaymentStatus.create('PENDING'),
			dueDate,
		})
		await inMemoryPaymentsRepository.create(payment)

		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.overdueCount).toBe(0)
		}

		const updated = await inMemoryPaymentsRepository.findById(
			payment.id.toString(),
		)
		expect(updated?.status).toBe('PENDING')
	})

	it('should send PAYMENT_OVERDUE notification to tenant', async () => {
		const tenantId = new UniqueEntityId('tenant-1')
		const dueDate = new Date()
		dueDate.setDate(dueDate.getDate() - 6)

		const payment = makePayment({
			tenantId,
			status: PaymentStatus.create('PENDING'),
			dueDate,
		})
		await inMemoryPaymentsRepository.create(payment)

		await sut.execute()

		expect(mockCreateNotification.calls).toHaveLength(1)
		expect(mockCreateNotification.calls[0].personId).toBe('tenant-1')
		expect(mockCreateNotification.calls[0].actionType).toBe('PAYMENT_OVERDUE')
	})

	it('should return overdueCount: 0 when no overdue payments', async () => {
		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.overdueCount).toBe(0)
		}
	})
})
