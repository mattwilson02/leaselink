import { InMemoryVendorsRepository } from 'test/repositories/prisma/in-memory-vendors-repository'
import { GetVendorByIdUseCase } from './get-vendor-by-id'
import { makeVendor } from 'test/factories/make-vendor'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { VendorNotFoundError } from './errors/vendor-not-found-error'

let vendorsRepository: InMemoryVendorsRepository
let sut: GetVendorByIdUseCase

describe('GetVendorById', () => {
	beforeEach(() => {
		vendorsRepository = new InMemoryVendorsRepository()
		sut = new GetVendorByIdUseCase(vendorsRepository)
	})

	it('should return vendor by id', async () => {
		const managerId = 'manager-1'
		const vendor = makeVendor({ managerId: new UniqueEntityId(managerId) })
		await vendorsRepository.create(vendor)

		const result = await sut.execute({
			vendorId: vendor.id.toString(),
			managerId,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.vendor.id.toString()).toBe(vendor.id.toString())
		}
	})

	it('should return error if vendor not found', async () => {
		const result = await sut.execute({
			vendorId: 'non-existent',
			managerId: 'manager-1',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(VendorNotFoundError)
	})

	it('should return error if manager does not own vendor', async () => {
		const vendor = makeVendor({ managerId: new UniqueEntityId('manager-a') })
		await vendorsRepository.create(vendor)

		const result = await sut.execute({
			vendorId: vendor.id.toString(),
			managerId: 'manager-b',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(VendorNotFoundError)
	})
})
