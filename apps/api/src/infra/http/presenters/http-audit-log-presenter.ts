import { AuditLog } from '@/domain/audit/enterprise/entities/audit-log'

export interface AuditLogHttpResponse {
	id: string
	actorId: string
	actorType: string
	action: string
	resourceType: string
	resourceId: string
	metadata: Record<string, unknown> | null
	createdAt: string
}

export class HttpAuditLogPresenter {
	static toHTTP(auditLog: AuditLog): AuditLogHttpResponse {
		return {
			id: auditLog.id.toString(),
			actorId: auditLog.actorId.toString(),
			actorType: auditLog.actorType,
			action: auditLog.action,
			resourceType: auditLog.resourceType,
			resourceId: auditLog.resourceId.toString(),
			metadata: auditLog.metadata,
			createdAt: auditLog.createdAt.toISOString(),
		}
	}

	static toHTTPList(auditLogs: AuditLog[]): AuditLogHttpResponse[] {
		return auditLogs.map(HttpAuditLogPresenter.toHTTP)
	}
}
