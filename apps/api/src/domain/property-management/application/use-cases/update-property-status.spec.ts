import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeProperty } from 'test/factories/make-property'
import { InMemoryPropertiesRepository } from 'test/repositories/prisma/in-memory-properties-repository'
import { UpdatePropertyStatusUseCase } from './update-property-status'
import { PropertyNotFoundError } from './errors/property-not-found-error'
import { InvalidPropertyStatusTransitionError } from './errors/invalid-property-status-transition-error'
import { PropertyHasActiveLeaseError } from './errors/property-has-active-lease-error'
import { PropertyStatus } from '../../enterprise/entities/value-objects/property-status'

let inMemoryPropertiesRepository: InMemoryPropertiesRepository
let sut: UpdatePropertyStatusUseCase

describe('Update property status', () => {
	beforeEach(() => {
		inMemoryPropertiesRepository = new InMemoryPropertiesRepository()
		sut = new UpdatePropertyStatusUseCase(inMemoryPropertiesRepository)
	})

	it('should transition VACANT → LISTED', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const property = makeProperty({
			managerId,
			status: PropertyStatus.create('VACANT'),
		})
		await inMemoryPropertiesRepository.create(property)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			managerId: 'manager-1',
			status: 'LISTED',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.property.status).toBe('LISTED')
		}
	})

	it('should transition VACANT → OCCUPIED', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const property = makeProperty({
			managerId,
			status: PropertyStatus.create('VACANT'),
		})
		await inMemoryPropertiesRepository.create(property)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			managerId: 'manager-1',
			status: 'OCCUPIED',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.property.status).toBe('OCCUPIED')
		}
	})

	it('should reject VACANT → MAINTENANCE', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const property = makeProperty({
			managerId,
			status: PropertyStatus.create('VACANT'),
		})
		await inMemoryPropertiesRepository.create(property)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			managerId: 'manager-1',
			status: 'MAINTENANCE',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(InvalidPropertyStatusTransitionError)
	})

	it('should reject OCCUPIED → VACANT with active lease', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const property = makeProperty({
			managerId,
			status: PropertyStatus.create('OCCUPIED'),
		})
		await inMemoryPropertiesRepository.create(property)
		inMemoryPropertiesRepository.activeLeasePropertyIds.add(
			property.id.toString(),
		)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			managerId: 'manager-1',
			status: 'VACANT',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(PropertyHasActiveLeaseError)
	})

	it('should allow OCCUPIED → VACANT without lease', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const property = makeProperty({
			managerId,
			status: PropertyStatus.create('OCCUPIED'),
		})
		await inMemoryPropertiesRepository.create(property)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			managerId: 'manager-1',
			status: 'VACANT',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.property.status).toBe('VACANT')
		}
	})

	it('should transition OCCUPIED → MAINTENANCE', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const property = makeProperty({
			managerId,
			status: PropertyStatus.create('OCCUPIED'),
		})
		await inMemoryPropertiesRepository.create(property)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			managerId: 'manager-1',
			status: 'MAINTENANCE',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.property.status).toBe('MAINTENANCE')
		}
	})

	it('should return error if not found', async () => {
		const result = await sut.execute({
			propertyId: 'non-existent',
			managerId: 'manager-1',
			status: 'LISTED',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(PropertyNotFoundError)
	})
})
