import { makePayment } from 'test/factories/make-payment'
import { InMemoryPaymentsRepository } from 'test/repositories/prisma/in-memory-payments-repository'
import { PaymentStatus } from '../../enterprise/entities/value-objects/payment-status'
import { ActivateUpcomingPaymentsUseCase } from './activate-upcoming-payments'

let inMemoryPaymentsRepository: InMemoryPaymentsRepository
let sut: ActivateUpcomingPaymentsUseCase

describe('ActivateUpcomingPayments', () => {
	beforeEach(() => {
		inMemoryPaymentsRepository = new InMemoryPaymentsRepository()

		sut = new ActivateUpcomingPaymentsUseCase(inMemoryPaymentsRepository)
	})

	it('should transition UPCOMING payments to PENDING when due date is today or past', async () => {
		const pastDate = new Date()
		pastDate.setDate(pastDate.getDate() - 2)

		const todayDate = new Date()

		const pastPayment = makePayment({
			status: PaymentStatus.create('UPCOMING'),
			dueDate: pastDate,
		})
		const todayPayment = makePayment({
			status: PaymentStatus.create('UPCOMING'),
			dueDate: todayDate,
		})
		await inMemoryPaymentsRepository.create(pastPayment)
		await inMemoryPaymentsRepository.create(todayPayment)

		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.activatedCount).toBe(2)
		}

		const updatedPast = await inMemoryPaymentsRepository.findById(
			pastPayment.id.toString(),
		)
		expect(updatedPast?.status).toBe('PENDING')

		const updatedToday = await inMemoryPaymentsRepository.findById(
			todayPayment.id.toString(),
		)
		expect(updatedToday?.status).toBe('PENDING')
	})

	it('should NOT transition UPCOMING payments with future due dates', async () => {
		const futureDate = new Date()
		futureDate.setDate(futureDate.getDate() + 5)

		const payment = makePayment({
			status: PaymentStatus.create('UPCOMING'),
			dueDate: futureDate,
		})
		await inMemoryPaymentsRepository.create(payment)

		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.activatedCount).toBe(0)
		}

		const updated = await inMemoryPaymentsRepository.findById(
			payment.id.toString(),
		)
		expect(updated?.status).toBe('UPCOMING')
	})

	it('should return correct count', async () => {
		const pastDate = new Date()
		pastDate.setDate(pastDate.getDate() - 1)

		const futureDate = new Date()
		futureDate.setDate(futureDate.getDate() + 5)

		const upcomingDue = makePayment({
			status: PaymentStatus.create('UPCOMING'),
			dueDate: pastDate,
		})
		const upcomingFuture = makePayment({
			status: PaymentStatus.create('UPCOMING'),
			dueDate: futureDate,
		})
		const pendingPayment = makePayment({
			status: PaymentStatus.create('PENDING'),
			dueDate: pastDate,
		})
		await inMemoryPaymentsRepository.create(upcomingDue)
		await inMemoryPaymentsRepository.create(upcomingFuture)
		await inMemoryPaymentsRepository.create(pendingPayment)

		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.activatedCount).toBe(1)
		}
	})

	it('should return activatedCount: 0 when no upcoming payments are due', async () => {
		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.activatedCount).toBe(0)
		}
	})
})
