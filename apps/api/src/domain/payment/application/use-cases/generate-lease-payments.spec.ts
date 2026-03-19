import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeLease } from 'test/factories/make-lease'
import { makePayment } from 'test/factories/make-payment'
import { InMemoryLeasesRepository } from 'test/repositories/prisma/in-memory-leases-repository'
import { InMemoryPaymentsRepository } from 'test/repositories/prisma/in-memory-payments-repository'
import { LeaseStatus } from '@/domain/lease-management/enterprise/entities/value-objects/lease-status'
import { PaymentStatus } from '../../enterprise/entities/value-objects/payment-status'
import { GenerateLeasePaymentsUseCase } from './generate-lease-payments'
import { PaymentNoActiveLeaseError } from './errors/payment-no-active-lease-error'

let inMemoryLeasesRepository: InMemoryLeasesRepository
let inMemoryPaymentsRepository: InMemoryPaymentsRepository
let sut: GenerateLeasePaymentsUseCase

describe('GenerateLeasePayments', () => {
	beforeEach(() => {
		inMemoryLeasesRepository = new InMemoryLeasesRepository()
		inMemoryPaymentsRepository = new InMemoryPaymentsRepository()
		sut = new GenerateLeasePaymentsUseCase(
			inMemoryLeasesRepository,
			inMemoryPaymentsRepository,
		)
	})

	it('should generate payments for an active lease', async () => {
		const lease = makeLease({
			status: LeaseStatus.create('ACTIVE'),
			monthlyRent: 2500,
		})
		await inMemoryLeasesRepository.create(lease)

		const result = await sut.execute({ leaseId: lease.id.toString() })

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.payments.length).toBeGreaterThanOrEqual(1)
		}
	})

	it('should set PENDING status for current month due date', async () => {
		const lease = makeLease({
			status: LeaseStatus.create('ACTIVE'),
			monthlyRent: 1500,
		})
		await inMemoryLeasesRepository.create(lease)

		const result = await sut.execute({ leaseId: lease.id.toString() })

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			const pendingPayments = result.value.payments.filter(
				(p) => p.status === 'PENDING',
			)
			expect(pendingPayments.length).toBeGreaterThanOrEqual(1)
		}
	})

	it('should set correct amount from lease monthlyRent', async () => {
		const lease = makeLease({
			status: LeaseStatus.create('ACTIVE'),
			monthlyRent: 2500,
		})
		await inMemoryLeasesRepository.create(lease)

		const result = await sut.execute({ leaseId: lease.id.toString() })

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			for (const payment of result.value.payments) {
				expect(payment.amount).toBe(2500)
			}
		}
	})

	it('should not create duplicates if payment already exists for a month', async () => {
		const lease = makeLease({
			status: LeaseStatus.create('ACTIVE'),
			monthlyRent: 2000,
		})
		await inMemoryLeasesRepository.create(lease)

		// Pre-create a payment for the current month
		const now = new Date()
		const existingPayment = makePayment({
			leaseId: lease.id,
			tenantId: lease.tenantId,
			dueDate: new Date(now.getFullYear(), now.getMonth(), 1),
			status: PaymentStatus.create('PENDING'),
		})
		await inMemoryPaymentsRepository.create(existingPayment)

		const result = await sut.execute({ leaseId: lease.id.toString() })

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			// Only the next month payment should be created
			expect(result.value.payments.length).toBeLessThanOrEqual(1)
		}
		// Total should be 2: the existing + at most 1 new
		expect(inMemoryPaymentsRepository.items.length).toBeLessThanOrEqual(2)
	})

	it('should reject if lease is not active', async () => {
		const lease = makeLease({
			status: LeaseStatus.create('PENDING'),
		})
		await inMemoryLeasesRepository.create(lease)

		const result = await sut.execute({ leaseId: lease.id.toString() })

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(PaymentNoActiveLeaseError)
	})

	it('should reject if lease does not exist', async () => {
		const result = await sut.execute({ leaseId: 'non-existent-id' })

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(PaymentNoActiveLeaseError)
	})
})
