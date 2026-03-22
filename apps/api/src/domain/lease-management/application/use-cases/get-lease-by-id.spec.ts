import { GetLeaseByIdUseCase } from './get-lease-by-id'
import { InMemoryLeasesRepository } from 'test/repositories/prisma/in-memory-leases-repository'
import { InMemoryPropertiesRepository } from 'test/repositories/prisma/in-memory-properties-repository'
import { makeLease } from 'test/factories/make-lease'
import { makeProperty } from 'test/factories/make-property'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { LeaseStatus } from '../../enterprise/entities/value-objects/lease-status'
import { LeaseNotFoundError } from './errors/lease-not-found-error'
import { LeaseForbiddenError } from './errors/lease-forbidden-error'

describe('GetLeaseByIdUseCase', () => {
	let inMemoryLeasesRepository: InMemoryLeasesRepository
	let inMemoryPropertiesRepository: InMemoryPropertiesRepository
	let sut: GetLeaseByIdUseCase

	beforeEach(() => {
		inMemoryLeasesRepository = new InMemoryLeasesRepository()
		inMemoryPropertiesRepository = new InMemoryPropertiesRepository()
		sut = new GetLeaseByIdUseCase(
			inMemoryLeasesRepository,
			inMemoryPropertiesRepository,
		)
	})

	it('should return lease for authorized CLIENT (own lease)', async () => {
		const tenantId = new UniqueEntityId('tenant-1')
		const lease = makeLease({
			tenantId,
			status: LeaseStatus.create('ACTIVE'),
		})
		inMemoryLeasesRepository.items.push(lease)

		const result = await sut.execute({
			leaseId: lease.id.toString(),
			requestingUserId: 'tenant-1',
			requestingUserType: 'CLIENT',
		})

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.lease.id.toString()).toBe(lease.id.toString())
		}
	})

	it('should return ForbiddenError when CLIENT requests another tenant lease', async () => {
		const lease = makeLease({
			tenantId: new UniqueEntityId('tenant-1'),
			status: LeaseStatus.create('ACTIVE'),
		})
		inMemoryLeasesRepository.items.push(lease)

		const result = await sut.execute({
			leaseId: lease.id.toString(),
			requestingUserId: 'tenant-other',
			requestingUserType: 'CLIENT',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(LeaseForbiddenError)
	})

	it('should return lease for authorized EMPLOYEE (managed property)', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const property = makeProperty({ managerId })
		inMemoryPropertiesRepository.items.push(property)

		const lease = makeLease({
			propertyId: property.id,
			status: LeaseStatus.create('ACTIVE'),
		})
		inMemoryLeasesRepository.items.push(lease)

		const result = await sut.execute({
			leaseId: lease.id.toString(),
			requestingUserId: 'manager-1',
			requestingUserType: 'EMPLOYEE',
		})

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.lease.id.toString()).toBe(lease.id.toString())
		}
	})

	it('should return ForbiddenError when EMPLOYEE requests lease for unmanaged property', async () => {
		const property = makeProperty({
			managerId: new UniqueEntityId('manager-other'),
		})
		inMemoryPropertiesRepository.items.push(property)

		const lease = makeLease({
			propertyId: property.id,
			status: LeaseStatus.create('ACTIVE'),
		})
		inMemoryLeasesRepository.items.push(lease)

		const result = await sut.execute({
			leaseId: lease.id.toString(),
			requestingUserId: 'manager-1',
			requestingUserType: 'EMPLOYEE',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(LeaseForbiddenError)
	})

	it('should return LeaseNotFoundError when lease does not exist', async () => {
		const result = await sut.execute({
			leaseId: 'non-existent',
			requestingUserId: 'user-1',
			requestingUserType: 'EMPLOYEE',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(LeaseNotFoundError)
	})
})
