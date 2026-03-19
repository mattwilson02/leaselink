import { InMemoryPropertiesRepository } from 'test/repositories/prisma/in-memory-properties-repository'
import { CreatePropertyUseCase } from './create-property'

let inMemoryPropertiesRepository: InMemoryPropertiesRepository
let sut: CreatePropertyUseCase

describe('Create property', () => {
	beforeEach(() => {
		inMemoryPropertiesRepository = new InMemoryPropertiesRepository()
		sut = new CreatePropertyUseCase(inMemoryPropertiesRepository)
	})

	it('should create a property', async () => {
		const result = await sut.execute({
			managerId: 'manager-1',
			address: '123 Main St',
			city: 'New York',
			state: 'NY',
			zipCode: '10001',
			propertyType: 'APARTMENT',
			bedrooms: 2,
			bathrooms: 1.5,
			rentAmount: 2500,
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryPropertiesRepository.items).toHaveLength(1)
		expect(inMemoryPropertiesRepository.items[0].address).toBe('123 Main St')
	})

	it('should default status to VACANT', async () => {
		const result = await sut.execute({
			managerId: 'manager-1',
			address: '123 Main St',
			city: 'New York',
			state: 'NY',
			zipCode: '10001',
			propertyType: 'APARTMENT',
			bedrooms: 2,
			bathrooms: 1,
			rentAmount: 2500,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.property.status).toBe('VACANT')
		}
	})

	it('should default photos to empty array', async () => {
		const result = await sut.execute({
			managerId: 'manager-1',
			address: '123 Main St',
			city: 'New York',
			state: 'NY',
			zipCode: '10001',
			propertyType: 'HOUSE',
			bedrooms: 3,
			bathrooms: 2,
			rentAmount: 3000,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.property.photos).toHaveLength(0)
		}
	})
})
