import { Payment } from './payment'
import { PaymentStatus } from './value-objects/payment-status'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InvalidPaymentStatusTransitionError } from '@/domain/payment/application/use-cases/errors/invalid-payment-status-transition-error'

const makePaymentEntity = (initialStatus = 'UPCOMING') =>
	Payment.create({
		leaseId: new UniqueEntityId(),
		tenantId: new UniqueEntityId(),
		amount: 1000,
		dueDate: new Date(),
		status: PaymentStatus.create(initialStatus),
	})

describe('Payment entity status transitions', () => {
	it('should allow UPCOMING -> PENDING transition', () => {
		const payment = makePaymentEntity('UPCOMING')
		expect(() => {
			payment.status = 'PENDING'
		}).not.toThrow()
		expect(payment.status).toBe('PENDING')
	})

	it('should allow PENDING -> PAID transition', () => {
		const payment = makePaymentEntity('PENDING')
		expect(() => {
			payment.status = 'PAID'
		}).not.toThrow()
		expect(payment.status).toBe('PAID')
	})

	it('should allow PENDING -> OVERDUE transition', () => {
		const payment = makePaymentEntity('PENDING')
		expect(() => {
			payment.status = 'OVERDUE'
		}).not.toThrow()
		expect(payment.status).toBe('OVERDUE')
	})

	it('should allow OVERDUE -> PAID transition', () => {
		const payment = makePaymentEntity('OVERDUE')
		expect(() => {
			payment.status = 'PAID'
		}).not.toThrow()
		expect(payment.status).toBe('PAID')
	})

	it('should throw InvalidPaymentStatusTransitionError on PAID -> PENDING', () => {
		const payment = makePaymentEntity('PAID')
		expect(() => {
			payment.status = 'PENDING'
		}).toThrow(InvalidPaymentStatusTransitionError)
	})

	it('should throw InvalidPaymentStatusTransitionError on PAID -> UPCOMING', () => {
		const payment = makePaymentEntity('PAID')
		expect(() => {
			payment.status = 'UPCOMING'
		}).toThrow(InvalidPaymentStatusTransitionError)
	})

	it('should throw InvalidPaymentStatusTransitionError on UPCOMING -> PAID (skip PENDING)', () => {
		const payment = makePaymentEntity('UPCOMING')
		expect(() => {
			payment.status = 'PAID'
		}).toThrow(InvalidPaymentStatusTransitionError)
	})

	it('should allow creating a new entity with any initial status (bypasses setter)', () => {
		const paid = makePaymentEntity('PAID')
		expect(paid.status).toBe('PAID')

		const overdue = makePaymentEntity('OVERDUE')
		expect(overdue.status).toBe('OVERDUE')
	})
})
