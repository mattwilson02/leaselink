import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Vendor } from '../../enterprise/entities/vendor'
import { VendorsRepository } from '../repositories/vendors-repository'
import { VendorNotFoundError } from './errors/vendor-not-found-error'
import type { MaintenanceCategoryType } from '@/domain/maintenance/enterprise/entities/value-objects/maintenance-category'

export interface UpdateVendorUseCaseRequest {
	vendorId: string
	managerId: string
	name?: string
	specialty?: string
	phone?: string | null
	email?: string | null
	notes?: string | null
}

type UpdateVendorUseCaseResponse = Either<
	VendorNotFoundError,
	{ vendor: Vendor }
>

@Injectable()
export class UpdateVendorUseCase {
	constructor(private vendorsRepository: VendorsRepository) {}

	async execute(
		request: UpdateVendorUseCaseRequest,
	): Promise<UpdateVendorUseCaseResponse> {
		const vendor = await this.vendorsRepository.findById(request.vendorId)

		if (!vendor || vendor.managerId.toString() !== request.managerId) {
			return left(new VendorNotFoundError())
		}

		if (request.name !== undefined) {
			vendor.name = request.name
		}

		if (request.specialty !== undefined) {
			vendor.specialty = request.specialty as MaintenanceCategoryType
		}

		if (request.phone !== undefined) {
			vendor.phone = request.phone
		}

		if (request.email !== undefined) {
			vendor.email = request.email
		}

		if (request.notes !== undefined) {
			vendor.notes = request.notes
		}

		const updated = await this.vendorsRepository.update(vendor)

		return right({ vendor: updated })
	}
}
