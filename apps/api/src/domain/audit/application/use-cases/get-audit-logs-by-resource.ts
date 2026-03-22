import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { AuditLog } from '../../enterprise/entities/audit-log'
import { AuditLogsRepository } from '../repositories/audit-logs-repository'

export interface GetAuditLogsByResourceUseCaseRequest {
	resourceType: string
	resourceId: string
	page: number
	pageSize: number
}

type GetAuditLogsByResourceUseCaseResponse = Either<
	never,
	{ auditLogs: AuditLog[]; totalCount: number }
>

@Injectable()
export class GetAuditLogsByResourceUseCase {
	constructor(private auditLogsRepository: AuditLogsRepository) {}

	async execute(
		request: GetAuditLogsByResourceUseCaseRequest,
	): Promise<GetAuditLogsByResourceUseCaseResponse> {
		const { auditLogs, totalCount } =
			await this.auditLogsRepository.findByResource(
				request.resourceType,
				request.resourceId,
				request.page,
				request.pageSize,
			)

		return right({ auditLogs, totalCount })
	}
}
