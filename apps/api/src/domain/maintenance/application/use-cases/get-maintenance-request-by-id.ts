import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { MaintenanceRequest } from '../../enterprise/entities/maintenance-request'
import { MaintenanceRequestsRepository } from '../repositories/maintenance-requests-repository'
import { PropertiesRepository } from '@/domain/property-management/application/repositories/properties-repository'
import { MaintenanceRequestNotFoundError } from './errors/maintenance-request-not-found-error'

export interface GetMaintenanceRequestByIdUseCaseRequest {
	requestId: string
	userId: string
	userRole: 'manager' | 'tenant'
}

type GetMaintenanceRequestByIdUseCaseResponse = Either<
	MaintenanceRequestNotFoundError,
	{ request: MaintenanceRequest }
>

@Injectable()
export class GetMaintenanceRequestByIdUseCase {
	constructor(
		private maintenanceRequestsRepository: MaintenanceRequestsRepository,
		private propertiesRepository: PropertiesRepository,
	) {}

	async execute(
		input: GetMaintenanceRequestByIdUseCaseRequest,
	): Promise<GetMaintenanceRequestByIdUseCaseResponse> {
		const request = await this.maintenanceRequestsRepository.findById(
			input.requestId,
		)

		if (!request) {
			return left(new MaintenanceRequestNotFoundError())
		}

		if (input.userRole === 'tenant') {
			if (request.tenantId.toString() !== input.userId) {
				return left(new MaintenanceRequestNotFoundError())
			}
		} else {
			const property = await this.propertiesRepository.findById(
				request.propertyId.toString(),
			)
			if (!property || property.managerId.toString() !== input.userId) {
				return left(new MaintenanceRequestNotFoundError())
			}
		}

		return right({ request })
	}
}
