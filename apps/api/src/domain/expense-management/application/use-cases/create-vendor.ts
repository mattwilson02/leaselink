import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Vendor } from '../../enterprise/entities/vendor'
import { VendorsRepository } from '../repositories/vendors-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { MaintenanceCategory } from '@/domain/maintenance/enterprise/entities/value-objects/maintenance-category'

export interface CreateVendorUseCaseRequest {
	managerId: string
	name: string
	specialty: string
	phone?: string
	email?: string
	notes?: string
}

type CreateVendorUseCaseResponse = Either<never, { vendor: Vendor }>

@Injectable()
export class CreateVendorUseCase {
	constructor(private vendorsRepository: VendorsRepository) {}

	async execute(
		request: CreateVendorUseCaseRequest,
	): Promise<CreateVendorUseCaseResponse> {
		const vendor = Vendor.create({
			managerId: new UniqueEntityId(request.managerId),
			name: request.name,
			specialty: MaintenanceCategory.create(request.specialty),
			phone: request.phone ?? null,
			email: request.email ?? null,
			notes: request.notes ?? null,
		})

		await this.vendorsRepository.create(vendor)

		return right({ vendor })
	}
}
