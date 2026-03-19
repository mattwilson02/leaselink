import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeProperty } from 'test/factories/make-property'
import { InMemoryPropertiesRepository } from 'test/repositories/prisma/in-memory-properties-repository'
import { DeletePropertyUseCase } from './delete-property'
import { PropertyNotFoundError } from './errors/property-not-found-error'
import { PropertyHasActiveLeaseError } from './errors/property-has-active-lease-error'

let inMemoryPropertiesRepository: InMemoryPropertiesRepository
let sut: DeletePropertyUseCase

describe('Delete property', () => {
	beforeEach(() => {
		inMemoryPropertiesRepository = new InMemoryPropertiesRepository()
		sut = new DeletePropertyUseCase(inMemoryPropertiesRepository)
	})

	it('should delete property', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const property = makeProperty({ managerId })
		await inMemoryPropertiesRepository.create(property)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			managerId: 'manager-1',
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryPropertiesRepository.items).toHaveLength(0)
	})

	it('should reject if has active lease', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const property = makeProperty({ managerId })
		await inMemoryPropertiesRepository.create(property)
		inMemoryPropertiesRepository.activeLeasePropertyIds.add(
			property.id.toString(),
		)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			managerId: 'manager-1',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(PropertyHasActiveLeaseError)
		expect(inMemoryPropertiesRepository.items).toHaveLength(1)
	})

	it('should return error if not found', async () => {
		const result = await sut.execute({
			propertyId: 'non-existent',
			managerId: 'manager-1',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(PropertyNotFoundError)
	})

	it('should return error if not owner', async () => {
		const property = makeProperty({
			managerId: new UniqueEntityId('manager-a'),
		})
		await inMemoryPropertiesRepository.create(property)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			managerId: 'manager-b',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(PropertyNotFoundError)
	})
})
