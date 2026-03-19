import { InMemoryLeasesRepository } from 'test/repositories/prisma/in-memory-leases-repository'
import { InMemoryPaymentsRepository } from 'test/repositories/prisma/in-memory-payments-repository'
import { makeLease } from 'test/factories/make-lease'
import { LeaseStatus } from '@/domain/lease-management/enterprise/entities/value-objects/lease-status'
import { GenerateLeasePaymentsUseCase } from './generate-lease-payments'
import { GenerateAllLeasePaymentsUseCase } from './generate-all-lease-payments'

let inMemoryLeasesRepository: InMemoryLeasesRepository
let inMemoryPaymentsRepository: InMemoryPaymentsRepository
let generateLeasePayments: GenerateLeasePaymentsUseCase
let sut: GenerateAllLeasePaymentsUseCase

describe('GenerateAllLeasePaymentsUseCase', () => {
	beforeEach(() => {
		inMemoryLeasesRepository = new InMemoryLeasesRepository()
		inMemoryPaymentsRepository = new InMemoryPaymentsRepository()
		generateLeasePayments = new GenerateLeasePaymentsUseCase(
			inMemoryLeasesRepository,
			inMemoryPaymentsRepository,
		)
		sut = new GenerateAllLeasePaymentsUseCase(
			inMemoryLeasesRepository,
			generateLeasePayments,
		)
	})

	it('should handle no active leases gracefully', async () => {
		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.totalGenerated).toBe(0)
		}
	})

	it('should generate payments for all active leases', async () => {
		const startDate = new Date('2026-01-01')

		for (let i = 0; i < 3; i++) {
			const lease = makeLease({
				status: LeaseStatus.create('ACTIVE'),
				startDate,
			})
			await inMemoryLeasesRepository.create(lease)
		}

		// Add a non-active lease — should be skipped
		const expiredLease = makeLease({ status: LeaseStatus.create('EXPIRED') })
		await inMemoryLeasesRepository.create(expiredLease)

		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.totalGenerated).toBeGreaterThan(0)
		}
	})

	it('should not double-generate payments on second run', async () => {
		const startDate = new Date('2026-01-01')
		const lease = makeLease({
			status: LeaseStatus.create('ACTIVE'),
			startDate,
		})
		await inMemoryLeasesRepository.create(lease)

		await sut.execute()
		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.totalGenerated).toBe(0)
		}
	})
})
