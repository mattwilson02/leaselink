import { UpdateLeaseStatusUseCase } from './update-lease-status'
import { InMemoryLeasesRepository } from 'test/repositories/prisma/in-memory-leases-repository'
import { InMemoryPropertiesRepository } from 'test/repositories/prisma/in-memory-properties-repository'
import { makeProperty } from 'test/factories/make-property'
import { makeLease } from 'test/factories/make-lease'
import { LeaseStatus } from '../../enterprise/entities/value-objects/lease-status'
import { PropertyStatus } from '@/domain/property-management/enterprise/entities/value-objects/property-status'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { LeaseNotFoundError } from './errors/lease-not-found-error'
import { InvalidLeaseStatusTransitionError } from './errors/invalid-lease-status-transition-error'

describe('UpdateLeaseStatusUseCase', () => {
	let inMemoryLeasesRepository: InMemoryLeasesRepository
	let inMemoryPropertiesRepository: InMemoryPropertiesRepository
	let sut: UpdateLeaseStatusUseCase

	beforeEach(() => {
		inMemoryLeasesRepository = new InMemoryLeasesRepository()
		inMemoryPropertiesRepository = new InMemoryPropertiesRepository()
		sut = new UpdateLeaseStatusUseCase(
			inMemoryLeasesRepository,
			inMemoryPropertiesRepository,
		)
	})

	it('should activate a pending lease', async () => {
		const property = makeProperty({ status: PropertyStatus.create('LISTED') })
		inMemoryPropertiesRepository.items.push(property)

		const lease = makeLease({
			propertyId: property.id,
			status: LeaseStatus.create('PENDING'),
		})
		inMemoryLeasesRepository.items.push(lease)

		const result = await sut.execute({
			leaseId: lease.id.toString(),
			status: 'ACTIVE',
		})

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.lease.status).toBe('ACTIVE')
		}
	})

	it('should set property to OCCUPIED when lease is activated', async () => {
		const property = makeProperty({ status: PropertyStatus.create('LISTED') })
		inMemoryPropertiesRepository.items.push(property)

		const lease = makeLease({
			propertyId: property.id,
			status: LeaseStatus.create('PENDING'),
		})
		inMemoryLeasesRepository.items.push(lease)

		await sut.execute({ leaseId: lease.id.toString(), status: 'ACTIVE' })

		const updatedProperty = inMemoryPropertiesRepository.items.find(
			(p) => p.id.toString() === property.id.toString(),
		)
		expect(updatedProperty?.status).toBe('OCCUPIED')
	})

	it('should not change property status if already OCCUPIED', async () => {
		const property = makeProperty({ status: PropertyStatus.create('OCCUPIED') })
		inMemoryPropertiesRepository.items.push(property)

		const lease = makeLease({
			propertyId: property.id,
			status: LeaseStatus.create('PENDING'),
		})
		inMemoryLeasesRepository.items.push(lease)

		const result = await sut.execute({
			leaseId: lease.id.toString(),
			status: 'ACTIVE',
		})

		expect(result.isRight()).toBe(true)
		const updatedProperty = inMemoryPropertiesRepository.items.find(
			(p) => p.id.toString() === property.id.toString(),
		)
		expect(updatedProperty?.status).toBe('OCCUPIED')
	})

	it('should reject invalid transition PENDING -> EXPIRED', async () => {
		const lease = makeLease({ status: LeaseStatus.create('PENDING') })
		inMemoryLeasesRepository.items.push(lease)

		const result = await sut.execute({
			leaseId: lease.id.toString(),
			status: 'EXPIRED',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(InvalidLeaseStatusTransitionError)
	})

	it('should expire an active lease', async () => {
		const property = makeProperty({ status: PropertyStatus.create('OCCUPIED') })
		inMemoryPropertiesRepository.items.push(property)

		const lease = makeLease({
			propertyId: property.id,
			status: LeaseStatus.create('ACTIVE'),
		})
		inMemoryLeasesRepository.items.push(lease)

		const result = await sut.execute({
			leaseId: lease.id.toString(),
			status: 'EXPIRED',
		})

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.lease.status).toBe('EXPIRED')
		}
	})

	it('should terminate an active lease', async () => {
		const property = makeProperty({ status: PropertyStatus.create('OCCUPIED') })
		inMemoryPropertiesRepository.items.push(property)

		const lease = makeLease({
			propertyId: property.id,
			status: LeaseStatus.create('ACTIVE'),
		})
		inMemoryLeasesRepository.items.push(lease)

		const result = await sut.execute({
			leaseId: lease.id.toString(),
			status: 'TERMINATED',
		})

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.lease.status).toBe('TERMINATED')
		}
	})

	it('should reject TERMINATED -> ACTIVE transition', async () => {
		const lease = makeLease({ status: LeaseStatus.create('TERMINATED') })
		inMemoryLeasesRepository.items.push(lease)

		const result = await sut.execute({
			leaseId: lease.id.toString(),
			status: 'ACTIVE',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(InvalidLeaseStatusTransitionError)
	})

	it('should return error if lease not found', async () => {
		const result = await sut.execute({
			leaseId: 'non-existent',
			status: 'ACTIVE',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(LeaseNotFoundError)
	})

	it('should expire original lease when a renewal lease is activated', async () => {
		const property = makeProperty({ status: PropertyStatus.create('OCCUPIED') })
		inMemoryPropertiesRepository.items.push(property)

		const originalLease = makeLease({
			propertyId: property.id,
			status: LeaseStatus.create('ACTIVE'),
		})
		inMemoryLeasesRepository.items.push(originalLease)

		const renewalLease = makeLease({
			propertyId: property.id,
			status: LeaseStatus.create('PENDING'),
			renewedFromLeaseId: new UniqueEntityId(originalLease.id.toString()),
		})
		inMemoryLeasesRepository.items.push(renewalLease)

		await sut.execute({ leaseId: renewalLease.id.toString(), status: 'ACTIVE' })

		const updatedOriginal = inMemoryLeasesRepository.items.find(
			(l) => l.id.toString() === originalLease.id.toString(),
		)
		expect(updatedOriginal?.status).toBe('EXPIRED')
	})
})
