import { RenewLeaseUseCase } from './renew-lease'
import { InMemoryLeasesRepository } from 'test/repositories/prisma/in-memory-leases-repository'
import { makeLease } from 'test/factories/make-lease'
import { LeaseStatus } from '../../enterprise/entities/value-objects/lease-status'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { LeaseNotFoundError } from './errors/lease-not-found-error'
import { LeaseRenewalInvalidSourceError } from './errors/lease-renewal-invalid-source-error'
import { LeaseRenewalStartDateInvalidError } from './errors/lease-renewal-start-date-invalid-error'
import { LeaseRenewalAlreadyExistsError } from './errors/lease-renewal-already-exists-error'
import type { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import { right } from '@/core/either'
import { ActionType } from '@/domain/notification/enterprise/entities/notification'

class MockCreateNotificationUseCase {
	calls: any[] = []
	async execute(input: any) {
		this.calls.push(input)
		return right({ notification: {} as any })
	}
}

describe('RenewLeaseUseCase', () => {
	let inMemoryLeasesRepository: InMemoryLeasesRepository
	let mockCreateNotificationUseCase: MockCreateNotificationUseCase
	let sut: RenewLeaseUseCase

	beforeEach(() => {
		inMemoryLeasesRepository = new InMemoryLeasesRepository()
		mockCreateNotificationUseCase = new MockCreateNotificationUseCase()
		sut = new RenewLeaseUseCase(
			inMemoryLeasesRepository,
			mockCreateNotificationUseCase as unknown as CreateNotificationUseCase,
		)
	})

	it('should create renewal from ACTIVE lease', async () => {
		const endDate = new Date('2027-04-01')
		const originalLease = makeLease({
			status: LeaseStatus.create('ACTIVE'),
			endDate,
		})
		inMemoryLeasesRepository.items.push(originalLease)

		const result = await sut.execute({
			leaseId: originalLease.id.toString(),
			startDate: new Date('2027-04-01').toISOString(),
			endDate: new Date('2028-04-01').toISOString(),
			monthlyRent: 2200,
			securityDeposit: 4400,
		})

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.lease.renewedFromLeaseId?.toString()).toBe(
				originalLease.id.toString(),
			)
			expect(result.value.lease.status).toBe('PENDING')
		}
	})

	it('should create renewal from EXPIRED lease', async () => {
		const endDate = new Date('2026-04-01')
		const originalLease = makeLease({
			status: LeaseStatus.create('EXPIRED'),
			endDate,
		})
		inMemoryLeasesRepository.items.push(originalLease)

		const result = await sut.execute({
			leaseId: originalLease.id.toString(),
			startDate: new Date('2026-04-01').toISOString(),
			endDate: new Date('2027-04-01').toISOString(),
			monthlyRent: 2200,
			securityDeposit: 4400,
		})

		expect(result.isRight()).toBe(true)
	})

	it('should reject renewal from PENDING lease', async () => {
		const originalLease = makeLease({ status: LeaseStatus.create('PENDING') })
		inMemoryLeasesRepository.items.push(originalLease)

		const result = await sut.execute({
			leaseId: originalLease.id.toString(),
			startDate: new Date('2027-04-01').toISOString(),
			endDate: new Date('2028-04-01').toISOString(),
			monthlyRent: 2200,
			securityDeposit: 4400,
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(LeaseRenewalInvalidSourceError)
	})

	it('should reject renewal from TERMINATED lease', async () => {
		const originalLease = makeLease({
			status: LeaseStatus.create('TERMINATED'),
		})
		inMemoryLeasesRepository.items.push(originalLease)

		const result = await sut.execute({
			leaseId: originalLease.id.toString(),
			startDate: new Date('2027-04-01').toISOString(),
			endDate: new Date('2028-04-01').toISOString(),
			monthlyRent: 2200,
			securityDeposit: 4400,
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(LeaseRenewalInvalidSourceError)
	})

	it('should reject if renewal start date is before original end date', async () => {
		const endDate = new Date('2027-04-01')
		const originalLease = makeLease({
			status: LeaseStatus.create('ACTIVE'),
			endDate,
		})
		inMemoryLeasesRepository.items.push(originalLease)

		const result = await sut.execute({
			leaseId: originalLease.id.toString(),
			startDate: new Date('2027-03-01').toISOString(),
			endDate: new Date('2028-04-01').toISOString(),
			monthlyRent: 2200,
			securityDeposit: 4400,
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(LeaseRenewalStartDateInvalidError)
	})

	it('should reject if a pending renewal already exists', async () => {
		const endDate = new Date('2027-04-01')
		const originalLease = makeLease({
			status: LeaseStatus.create('ACTIVE'),
			endDate,
		})
		inMemoryLeasesRepository.items.push(originalLease)

		const existingRenewal = makeLease({
			status: LeaseStatus.create('PENDING'),
			renewedFromLeaseId: new UniqueEntityId(originalLease.id.toString()),
		})
		inMemoryLeasesRepository.items.push(existingRenewal)

		const result = await sut.execute({
			leaseId: originalLease.id.toString(),
			startDate: new Date('2027-04-01').toISOString(),
			endDate: new Date('2028-04-01').toISOString(),
			monthlyRent: 2200,
			securityDeposit: 4400,
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(LeaseRenewalAlreadyExistsError)
	})

	it('should send LEASE_RENEWAL notification to tenant on renewal', async () => {
		const endDate = new Date('2027-04-01')
		const tenantId = new UniqueEntityId('tenant-1')
		const originalLease = makeLease({
			status: LeaseStatus.create('ACTIVE'),
			endDate,
			tenantId,
		})
		inMemoryLeasesRepository.items.push(originalLease)

		await sut.execute({
			leaseId: originalLease.id.toString(),
			startDate: new Date('2027-04-01').toISOString(),
			endDate: new Date('2028-04-01').toISOString(),
			monthlyRent: 2200,
			securityDeposit: 4400,
		})

		expect(mockCreateNotificationUseCase.calls).toHaveLength(1)
		expect(mockCreateNotificationUseCase.calls[0].personId).toBe('tenant-1')
		expect(mockCreateNotificationUseCase.calls[0].actionType).toBe(
			ActionType.LEASE_RENEWAL,
		)
	})

	it('should return error if lease not found', async () => {
		const result = await sut.execute({
			leaseId: 'non-existent',
			startDate: new Date('2027-04-01').toISOString(),
			endDate: new Date('2028-04-01').toISOString(),
			monthlyRent: 2200,
			securityDeposit: 4400,
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(LeaseNotFoundError)
	})
})
