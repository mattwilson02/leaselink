import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeProperty } from 'test/factories/make-property'
import { InMemoryPropertiesRepository } from 'test/repositories/prisma/in-memory-properties-repository'
import { GetPropertyByIdUseCase } from './get-property-by-id'
import { PropertyNotFoundError } from './errors/property-not-found-error'

let inMemoryPropertiesRepository: InMemoryPropertiesRepository
let sut: GetPropertyByIdUseCase

describe('Get property by id', () => {
	beforeEach(() => {
		inMemoryPropertiesRepository = new InMemoryPropertiesRepository()
		sut = new GetPropertyByIdUseCase(inMemoryPropertiesRepository)
	})

	it('should get a property by id', async () => {
		const managerId = new UniqueEntityId('manager-1')
		const property = makeProperty({ managerId })
		await inMemoryPropertiesRepository.create(property)

		const result = await sut.execute({
			propertyId: property.id.toString(),
			managerId: 'manager-1',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.property.id.toString()).toBe(property.id.toString())
		}
	})

	it('should return error if not found', async () => {
		const result = await sut.execute({
			propertyId: 'non-existent',
			managerId: 'manager-1',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(PropertyNotFoundError)
	})

	it("should return error if manager doesn't own it", async () => {
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
