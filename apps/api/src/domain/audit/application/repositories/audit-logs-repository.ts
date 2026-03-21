import type { AuditLog } from '../../enterprise/entities/audit-log'

export interface AuditLogsFilterParams {
	resourceType?: string
	resourceId?: string
	action?: string
	actorId?: string
	dateFrom?: Date
	dateTo?: Date
	page: number
	pageSize: number
}

export interface AuditLogsPaginatedResult {
	auditLogs: AuditLog[]
	totalCount: number
}

export abstract class AuditLogsRepository {
	abstract create(auditLog: AuditLog): Promise<void>
	abstract findMany(
		params: AuditLogsFilterParams,
	): Promise<AuditLogsPaginatedResult>
	abstract findByResource(
		resourceType: string,
		resourceId: string,
		page: number,
		pageSize: number,
	): Promise<AuditLogsPaginatedResult>
}
