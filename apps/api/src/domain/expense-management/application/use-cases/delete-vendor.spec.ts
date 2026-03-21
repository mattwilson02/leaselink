import { InMemoryVendorsRepository } from 'test/repositories/prisma/in-memory-vendors-repository'
import { DeleteVendorUseCase } from './delete-vendor'
import { makeVendor } from 'test/factories/make-vendor'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { VendorNotFoundError } from './errors/vendor-not-found-error'
import { VendorHasAssignedRequestsError } from './errors/vendor-has-assigned-requests-error'

let vendorsRepository: InMemoryVendorsRepository
let sut: DeleteVendorUseCase

describe('DeleteVendor', () => {
	beforeEach(() => {
		vendorsRepository = new InMemoryVendorsRepository()
		sut = new DeleteVendorUseCase(vendorsRepository)
	})

	it('should delete vendor with no open requests', async () => {
		const managerId = 'manager-1'
		const vendor = makeVendor({ managerId: new UniqueEntityId(managerId) })
		await vendorsRepository.create(vendor)

		const result = await sut.execute({
			vendorId: vendor.id.toString(),
			managerId,
		})

		expect(result.isRight()).toBeTruthy()
		expect(vendorsRepository.items).toHaveLength(0)
	})

	it('should reject if vendor has open requests', async () => {
		const managerId = 'manager-1'
		const vendor = makeVendor({ managerId: new UniqueEntityId(managerId) })
		await vendorsRepository.create(vendor)
		vendorsRepository.vendorIdsWithOpenRequests.add(vendor.id.toString())

		const result = await sut.execute({
			vendorId: vendor.id.toString(),
			managerId,
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(VendorHasAssignedRequestsError)
		expect(vendorsRepository.items).toHaveLength(1)
	})

	it('should allow delete if only CLOSED requests (not in open set)', async () => {
		const managerId = 'manager-1'
		const vendor = makeVendor({ managerId: new UniqueEntityId(managerId) })
		await vendorsRepository.create(vendor)
		// Not adding to open set — only CLOSED requests

		const result = await sut.execute({
			vendorId: vendor.id.toString(),
			managerId,
		})

		expect(result.isRight()).toBeTruthy()
		expect(vendorsRepository.items).toHaveLength(0)
	})

	it('should return error if not found', async () => {
		const result = await sut.execute({
			vendorId: 'non-existent',
			managerId: 'manager-1',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(VendorNotFoundError)
	})

	it('should return error if not owner', async () => {
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
