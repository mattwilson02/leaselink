import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { MaintenanceRequest } from '../../enterprise/entities/maintenance-request'
import { MaintenanceRequestsRepository } from '../repositories/maintenance-requests-repository'

export interface GetMaintenanceRequestsUseCaseRequest {
	managerId: string
	status?: string
	priority?: string
	category?: string
	propertyId?: string
	page: number
	pageSize: number
}

type GetMaintenanceRequestsUseCaseResponse = Either<
	never,
	{ requests: MaintenanceRequest[]; totalCount: number }
>

@Injectable()
export class GetMaintenanceRequestsUseCase {
	constructor(
		private maintenanceRequestsRepository: MaintenanceRequestsRepository,
	) {}

	async execute(
		input: GetMaintenanceRequestsUseCaseRequest,
	): Promise<GetMaintenanceRequestsUseCaseResponse> {
		const result = await this.maintenanceRequestsRepository.findMany({
			managerId: input.managerId,
			status: input.status,
			priority: input.priority,
			category: input.category,
			propertyId: input.propertyId,
			page: input.page,
			pageSize: input.pageSize,
		})

		return right({ requests: result.requests, totalCount: result.totalCount })
	}
}
