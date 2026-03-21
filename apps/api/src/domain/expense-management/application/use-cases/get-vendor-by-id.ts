import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Vendor } from '../../enterprise/entities/vendor'
import { VendorsRepository } from '../repositories/vendors-repository'
import { VendorNotFoundError } from './errors/vendor-not-found-error'

export interface GetVendorByIdUseCaseRequest {
	vendorId: string
	managerId: string
}

type GetVendorByIdUseCaseResponse = Either<
	VendorNotFoundError,
	{ vendor: Vendor }
>

@Injectable()
export class GetVendorByIdUseCase {
	constructor(private vendorsRepository: VendorsRepository) {}

	async execute(
		request: GetVendorByIdUseCaseRequest,
	): Promise<GetVendorByIdUseCaseResponse> {
		const vendor = await this.vendorsRepository.findById(request.vendorId)

		if (!vendor || vendor.managerId.toString() !== request.managerId) {
			return left(new VendorNotFoundError())
		}

		return right({ vendor })
	}
}
