import { InMemoryVendorsRepository } from 'test/repositories/prisma/in-memory-vendors-repository'
import { GetVendorsUseCase } from './get-vendors'
import { makeVendor } from 'test/factories/make-vendor'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { MaintenanceCategory } from '@/domain/maintenance/enterprise/entities/value-objects/maintenance-category'

let vendorsRepository: InMemoryVendorsRepository
let sut: GetVendorsUseCase

describe('GetVendors', () => {
	beforeEach(() => {
		vendorsRepository = new InMemoryVendorsRepository()
		sut = new GetVendorsUseCase(vendorsRepository)
	})

	it("should list manager's vendors only", async () => {
		const managerA = 'manager-a'
		const managerB = 'manager-b'

		for (let i = 0; i < 3; i++) {
			await vendorsRepository.create(
				makeVendor({ managerId: new UniqueEntityId(managerA) }),
			)
		}
		for (let i = 0; i < 2; i++) {
			await vendorsRepository.create(
				makeVendor({ managerId: new UniqueEntityId(managerB) }),
			)
		}

		const result = await sut.execute({
			managerId: managerA,
			page: 1,
			pageSize: 20,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.vendors).toHaveLength(3)
			expect(result.value.totalCount).toBe(3)
		}
	})

	it('should filter by specialty', async () => {
		const managerId = 'manager-1'
		const managerIdObj = new UniqueEntityId(managerId)

		await vendorsRepository.create(
			makeVendor({
				managerId: managerIdObj,
				specialty: MaintenanceCategory.create('PLUMBING'),
			}),
		)
		await vendorsRepository.create(
			makeVendor({
				managerId: managerIdObj,
				specialty: MaintenanceCategory.create('ELECTRICAL'),
			}),
		)

		const result = await sut.execute({
			managerId,
			specialty: 'PLUMBING',
			page: 1,
			pageSize: 20,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.vendors).toHaveLength(1)
			expect(result.value.vendors[0].specialty).toBe('PLUMBING')
		}
	})

	it('should search by name', async () => {
		const managerId = 'manager-1'
		const managerIdObj = new UniqueEntityId(managerId)

		await vendorsRepository.create(
			makeVendor({ managerId: managerIdObj, name: "Joe's Plumbing" }),
		)
		await vendorsRepository.create(
			makeVendor({ managerId: managerIdObj, name: 'Acme Electric' }),
		)

		const result = await sut.execute({
			managerId,
			search: 'Joe',
			page: 1,
			pageSize: 20,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.vendors).toHaveLength(1)
			expect(result.value.vendors[0].name).toBe("Joe's Plumbing")
		}
	})
})
