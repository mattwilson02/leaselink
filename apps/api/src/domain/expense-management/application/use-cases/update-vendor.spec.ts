import { InMemoryVendorsRepository } from 'test/repositories/prisma/in-memory-vendors-repository'
import { UpdateVendorUseCase } from './update-vendor'
import { makeVendor } from 'test/factories/make-vendor'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { VendorNotFoundError } from './errors/vendor-not-found-error'

let vendorsRepository: InMemoryVendorsRepository
let sut: UpdateVendorUseCase

describe('UpdateVendor', () => {
	beforeEach(() => {
		vendorsRepository = new InMemoryVendorsRepository()
		sut = new UpdateVendorUseCase(vendorsRepository)
	})

	it('should update vendor', async () => {
		const managerId = 'manager-1'
		const vendor = makeVendor({ managerId: new UniqueEntityId(managerId) })
		await vendorsRepository.create(vendor)

		const result = await sut.execute({
			vendorId: vendor.id.toString(),
			managerId,
			name: 'Updated Name',
			phone: '555-9999',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.vendor.name).toBe('Updated Name')
			expect(result.value.vendor.phone).toBe('555-9999')
		}
	})

	it('should reject if manager does not own vendor', async () => {
		const vendor = makeVendor({ managerId: new UniqueEntityId('manager-a') })
		await vendorsRepository.create(vendor)

		const result = await sut.execute({
			vendorId: vendor.id.toString(),
			managerId: 'manager-b',
			name: 'Updated Name',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(VendorNotFoundError)
	})

	it('should return error if vendor not found', async () => {
		const result = await sut.execute({
			vendorId: 'non-existent',
			managerId: 'manager-1',
			name: 'Updated Name',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(VendorNotFoundError)
	})
})
