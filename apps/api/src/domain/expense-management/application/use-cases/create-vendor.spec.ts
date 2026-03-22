import { InMemoryVendorsRepository } from 'test/repositories/prisma/in-memory-vendors-repository'
import { CreateVendorUseCase } from './create-vendor'

let vendorsRepository: InMemoryVendorsRepository
let sut: CreateVendorUseCase

describe('CreateVendor', () => {
	beforeEach(() => {
		vendorsRepository = new InMemoryVendorsRepository()
		sut = new CreateVendorUseCase(vendorsRepository)
	})

	it('should create vendor', async () => {
		const result = await sut.execute({
			managerId: 'manager-1',
			name: "Joe's Plumbing",
			specialty: 'PLUMBING',
		})

		expect(result.isRight()).toBeTruthy()
		expect(vendorsRepository.items).toHaveLength(1)
		if (result.isRight()) {
			expect(result.value.vendor.name).toBe("Joe's Plumbing")
			expect(result.value.vendor.specialty).toBe('PLUMBING')
		}
	})
})
