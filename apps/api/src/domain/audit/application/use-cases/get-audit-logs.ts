import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { AuditLog } from '../../enterprise/entities/audit-log'
import {
	AuditLogsRepository,
	AuditLogsFilterParams,
} from '../repositories/audit-logs-repository'

export interface GetAuditLogsUseCaseRequest {
	resourceType?: string
	resourceId?: string
	action?: string
	actorId?: string
	dateFrom?: Date
	dateTo?: Date
	page: number
	pageSize: number
}

type GetAuditLogsUseCaseResponse = Either<
	never,
	{ auditLogs: AuditLog[]; totalCount: number }
>

@Injectable()
export class GetAuditLogsUseCase {
	constructor(private auditLogsRepository: AuditLogsRepository) {}

	async execute(
		request: GetAuditLogsUseCaseRequest,
	): Promise<GetAuditLogsUseCaseResponse> {
		const params: AuditLogsFilterParams = {
			resourceType: request.resourceType,
			resourceId: request.resourceId,
			action: request.action,
			actorId: request.actorId,
			dateFrom: request.dateFrom,
			dateTo: request.dateTo,
			page: request.page,
			pageSize: request.pageSize,
		}

		const { auditLogs, totalCount } =
			await this.auditLogsRepository.findMany(params)

		return right({ auditLogs, totalCount })
	}
}
