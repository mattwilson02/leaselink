import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { VendorsRepository } from '../repositories/vendors-repository'
import { VendorNotFoundError } from './errors/vendor-not-found-error'
import { VendorHasAssignedRequestsError } from './errors/vendor-has-assigned-requests-error'

export interface DeleteVendorUseCaseRequest {
	vendorId: string
	managerId: string
}

type DeleteVendorUseCaseResponse = Either<
	VendorNotFoundError | VendorHasAssignedRequestsError,
	object
>

@Injectable()
export class DeleteVendorUseCase {
	constructor(private vendorsRepository: VendorsRepository) {}

	async execute(
		request: DeleteVendorUseCaseRequest,
	): Promise<DeleteVendorUseCaseResponse> {
		const vendor = await this.vendorsRepository.findById(request.vendorId)

		if (!vendor || vendor.managerId.toString() !== request.managerId) {
			return left(new VendorNotFoundError())
		}

		const hasOpenRequests =
			await this.vendorsRepository.hasOpenMaintenanceRequests(request.vendorId)

		if (hasOpenRequests) {
			return left(new VendorHasAssignedRequestsError())
		}

		await this.vendorsRepository.delete(request.vendorId)

		return right({})
	}
}
