import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { MaintenanceRequest } from '../../enterprise/entities/maintenance-request'
import { MaintenanceRequestsRepository } from '../repositories/maintenance-requests-repository'
import { MaintenanceRequestNotFoundError } from './errors/maintenance-request-not-found-error'

export interface ConfirmMaintenancePhotosUseCaseRequest {
	requestId: string
	tenantId: string
	blobKeys: string[]
}

type ConfirmMaintenancePhotosUseCaseResponse = Either<
	MaintenanceRequestNotFoundError,
	{ request: MaintenanceRequest }
>

@Injectable()
export class ConfirmMaintenancePhotosUseCase {
	constructor(
		private maintenanceRequestsRepository: MaintenanceRequestsRepository,
	) {}

	async execute(
		input: ConfirmMaintenancePhotosUseCaseRequest,
	): Promise<ConfirmMaintenancePhotosUseCaseResponse> {
		const request = await this.maintenanceRequestsRepository.findById(
			input.requestId,
		)

		if (!request || request.tenantId.toString() !== input.tenantId) {
			return left(new MaintenanceRequestNotFoundError())
		}

		request.photos = [...request.photos, ...input.blobKeys]

		const updated = await this.maintenanceRequestsRepository.update(request)

		return right({ request: updated })
	}
}
