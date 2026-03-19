import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { makeProperty } from 'test/factories/make-property'
import { InMemoryPropertiesRepository } from 'test/repositories/prisma/in-memory-properties-repository'
import { GetPropertiesByManagerUseCase } from './get-properties-by-manager'
import { PropertyStatus } from '../../enterprise/entities/value-objects/property-status'

let inMemoryPropertiesRepository: InMemoryPropertiesRepository
let sut: GetPropertiesByManagerUseCase

describe('Get properties by manager', () => {
	beforeEach(() => {
		inMemoryPropertiesRepository = new InMemoryPropertiesRepository()
		sut = new GetPropertiesByManagerUseCase(inMemoryPropertiesRepository)
	})

	it('should list properties for manager', async () => {
		const managerA = new UniqueEntityId('manager-a')
		const managerB = new UniqueEntityId('manager-b')

		for (let i = 0; i < 3; i++) {
			await inMemoryPropertiesRepository.create(
				makeProperty({ managerId: managerA }),
			)
		}
		for (let i = 0; i < 2; i++) {
			await inMemoryPropertiesRepository.create(
				makeProperty({ managerId: managerB }),
			)
		}

		const result = await sut.execute({
			managerId: 'manager-a',
			page: 1,
			pageSize: 20,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.properties).toHaveLength(3)
			expect(result.value.totalCount).toBe(3)
		}
	})

	it('should filter by status', async () => {
		const managerId = new UniqueEntityId('manager-1')

		await inMemoryPropertiesRepository.create(
			makeProperty({
				managerId,
				status: PropertyStatus.create('VACANT'),
			}),
		)
		await inMemoryPropertiesRepository.create(
			makeProperty({
				managerId,
				status: PropertyStatus.create('OCCUPIED'),
			}),
		)
		await inMemoryPropertiesRepository.create(
			makeProperty({
				managerId,
				status: PropertyStatus.create('VACANT'),
			}),
		)

		const result = await sut.execute({
			managerId: 'manager-1',
			status: 'VACANT',
			page: 1,
			pageSize: 20,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.properties).toHaveLength(2)
		}
	})

	it('should search by address', async () => {
		const managerId = new UniqueEntityId('manager-1')

		await inMemoryPropertiesRepository.create(
			makeProperty({ managerId, address: '123 Oak Street' }),
		)
		await inMemoryPropertiesRepository.create(
			makeProperty({ managerId, address: '456 Pine Avenue' }),
		)

		const result = await sut.execute({
			managerId: 'manager-1',
			search: 'Oak',
			page: 1,
			pageSize: 20,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.properties).toHaveLength(1)
			expect(result.value.properties[0].address).toBe('123 Oak Street')
		}
	})

	it('should paginate correctly', async () => {
		const managerId = new UniqueEntityId('manager-1')

		for (let i = 0; i < 5; i++) {
			await inMemoryPropertiesRepository.create(makeProperty({ managerId }))
		}

		const result = await sut.execute({
			managerId: 'manager-1',
			page: 1,
			pageSize: 2,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.properties).toHaveLength(2)
			expect(result.value.totalCount).toBe(5)
		}
	})
})
