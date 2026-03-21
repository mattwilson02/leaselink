import type {
	AuditLogsRepository,
	AuditLogsFilterParams,
	AuditLogsPaginatedResult,
} from '@/domain/audit/application/repositories/audit-logs-repository'
import type { AuditLog } from '@/domain/audit/enterprise/entities/audit-log'

export class InMemoryAuditLogsRepository implements AuditLogsRepository {
	public items: AuditLog[] = []

	async create(auditLog: AuditLog): Promise<void> {
		this.items.push(auditLog)
	}

	async findMany(
		params: AuditLogsFilterParams,
	): Promise<AuditLogsPaginatedResult> {
		let filtered = [...this.items]

		if (params.resourceType) {
			filtered = filtered.filter((l) => l.resourceType === params.resourceType)
		}

		if (params.resourceId) {
			filtered = filtered.filter(
				(l) => l.resourceId.toString() === params.resourceId,
			)
		}

		if (params.action) {
			filtered = filtered.filter((l) => l.action === params.action)
		}

		if (params.actorId) {
			filtered = filtered.filter((l) => l.actorId.toString() === params.actorId)
		}

		if (params.dateFrom) {
			filtered = filtered.filter((l) => l.createdAt >= params.dateFrom!)
		}

		if (params.dateTo) {
			filtered = filtered.filter((l) => l.createdAt <= params.dateTo!)
		}

		const totalCount = filtered.length
		const start = (params.page - 1) * params.pageSize
		const paginated = filtered.slice(start, start + params.pageSize)

		return { auditLogs: paginated, totalCount }
	}

	async findByResource(
		resourceType: string,
		resourceId: string,
		page: number,
		pageSize: number,
	): Promise<AuditLogsPaginatedResult> {
		const filtered = this.items.filter(
			(l) =>
				l.resourceType === resourceType &&
				l.resourceId.toString() === resourceId,
		)

		const totalCount = filtered.length
		const start = (page - 1) * pageSize
		const paginated = filtered.slice(start, start + pageSize)

		return { auditLogs: paginated, totalCount }
	}
}
