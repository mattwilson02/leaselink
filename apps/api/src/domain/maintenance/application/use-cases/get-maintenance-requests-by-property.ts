import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { MaintenanceRequest } from '../../enterprise/entities/maintenance-request'
import { MaintenanceRequestsRepository } from '../repositories/maintenance-requests-repository'

export interface GetMaintenanceRequestsByPropertyUseCaseRequest {
	propertyId: string
	status?: string
	page: number
	pageSize: number
}

type GetMaintenanceRequestsByPropertyUseCaseResponse = Either<
	never,
	{ requests: MaintenanceRequest[]; totalCount: number }
>

@Injectable()
export class GetMaintenanceRequestsByPropertyUseCase {
	constructor(
		private maintenanceRequestsRepository: MaintenanceRequestsRepository,
	) {}

	async execute(
		input: GetMaintenanceRequestsByPropertyUseCaseRequest,
	): Promise<GetMaintenanceRequestsByPropertyUseCaseResponse> {
		const result = await this.maintenanceRequestsRepository.findManyByProperty({
			propertyId: input.propertyId,
			status: input.status,
			page: input.page,
			pageSize: input.pageSize,
		})

		return right({ requests: result.requests, totalCount: result.totalCount })
	}
}
