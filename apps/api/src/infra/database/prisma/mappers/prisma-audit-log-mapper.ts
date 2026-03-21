import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { AuditLog } from '@/domain/audit/enterprise/entities/audit-log'
import { Prisma, AuditLog as PrismaAuditLog } from '@prisma/client'

export class PrismaAuditLogMapper {
	static toDomain(raw: PrismaAuditLog): AuditLog {
		return AuditLog.create(
			{
				actorId: new UniqueEntityId(raw.actorId),
				actorType: raw.actorType,
				action: raw.action,
				resourceType: raw.resourceType,
				resourceId: new UniqueEntityId(raw.resourceId),
				metadata: raw.metadata as Record<string, unknown> | null,
				createdAt: raw.createdAt,
			},
			new UniqueEntityId(raw.id),
		)
	}

	static toPrisma(auditLog: AuditLog): Prisma.AuditLogUncheckedCreateInput {
		return {
			id: auditLog.id.toString(),
			actorId: auditLog.actorId.toString(),
			actorType: auditLog.actorType,
			action: auditLog.action as any,
			resourceType: auditLog.resourceType as any,
			resourceId: auditLog.resourceId.toString(),
			metadata: (auditLog.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
			createdAt: auditLog.createdAt,
		}
	}
}
