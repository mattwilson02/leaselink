import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeProperty } from 'test/factories/make-property'
import { InMemoryPropertiesRepository } from 'test/repositories/prisma/in-memory-properties-repository'
import { UpdatePropertyUseCase } from './update-property'
import { PropertyNotFoundError } from './errors/property-not-found-error'

let inMemoryPropertiesRepository: InMemoryPropertiesRepository
let sut: UpdatePropertyUseCase

describe('Update property', () => {
	beforeEach(() => {
		inMemoryPropertiesRepository = new InMemoryPropertiesRepository()
		sut = new UpdatePropertyUseCase(inMemoryPropertiesRepository)
	})

	it('should update property fields', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const property = makeProperty({ managerId })
		await inMemoryPropertiesRepository.create(property)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			managerId: 'manager-1',
			address: '999 New Address',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.property.address).toBe('999 New Address')
		}
	})

	it('should only update provided fields', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const property = makeProperty({
			managerId,
			address: '123 Original St',
			rentAmount: 2000,
		})
		await inMemoryPropertiesRepository.create(property)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			managerId: 'manager-1',
			rentAmount: 2500,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.property.rentAmount).toBe(2500)
			expect(result.value.property.address).toBe('123 Original St')
		}
	})

	it('should return error if not found', async () => {
		const result = await sut.execute({
			propertyId: 'non-existent',
			managerId: 'manager-1',
			address: 'New Address',
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
			address: 'New Address',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(PropertyNotFoundError)
	})
})
