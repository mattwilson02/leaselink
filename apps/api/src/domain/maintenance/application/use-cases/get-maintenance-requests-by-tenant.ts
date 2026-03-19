import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { MaintenanceRequest } from '../../enterprise/entities/maintenance-request'
import { MaintenanceRequestsRepository } from '../repositories/maintenance-requests-repository'

export interface GetMaintenanceRequestsByTenantUseCaseRequest {
	tenantId: string
	status?: string
	page: number
	pageSize: number
}

type GetMaintenanceRequestsByTenantUseCaseResponse = Either<
	never,
	{ requests: MaintenanceRequest[]; totalCount: number }
>

@Injectable()
export class GetMaintenanceRequestsByTenantUseCase {
	constructor(
		private maintenanceRequestsRepository: MaintenanceRequestsRepository,
	) {}

	async execute(
		input: GetMaintenanceRequestsByTenantUseCaseRequest,
	): Promise<GetMaintenanceRequestsByTenantUseCaseResponse> {
		const result = await this.maintenanceRequestsRepository.findManyByTenant({
			tenantId: input.tenantId,
			status: input.status,
			page: input.page,
			pageSize: input.pageSize,
		})

		return right({ requests: result.requests, totalCount: result.totalCount })
	}
}
