import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaAuditLogMapper } from '../mappers/prisma-audit-log-mapper'
import type {
	AuditLogsRepository,
	AuditLogsFilterParams,
	AuditLogsPaginatedResult,
} from '@/domain/audit/application/repositories/audit-logs-repository'
import type { AuditLog } from '@/domain/audit/enterprise/entities/audit-log'
import { Prisma } from '@prisma/client'

@Injectable()
export class PrismaAuditLogsRepository implements AuditLogsRepository {
	constructor(private prisma: PrismaService) {}

	async create(auditLog: AuditLog): Promise<void> {
		const data = PrismaAuditLogMapper.toPrisma(auditLog)
		await this.prisma.auditLog.create({ data })
	}

	async findMany(
		params: AuditLogsFilterParams,
	): Promise<AuditLogsPaginatedResult> {
		const where: Prisma.AuditLogWhereInput = {}

		if (params.resourceType) {
			where.resourceType = params.resourceType as any
		}

		if (params.resourceId) {
			where.resourceId = params.resourceId
		}

		if (params.action) {
			where.action = params.action as any
		}

		if (params.actorId) {
			where.actorId = params.actorId
		}

		if (params.dateFrom || params.dateTo) {
			where.createdAt = {}
			if (params.dateFrom) {
				where.createdAt.gte = params.dateFrom
			}
			if (params.dateTo) {
				where.createdAt.lte = params.dateTo
			}
		}

		const [auditLogs, totalCount] = await Promise.all([
			this.prisma.auditLog.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip: (params.page - 1) * params.pageSize,
				take: params.pageSize,
			}),
			this.prisma.auditLog.count({ where }),
		])

		return {
			auditLogs: auditLogs.map(PrismaAuditLogMapper.toDomain),
			totalCount,
		}
	}

	async findByResource(
		resourceType: string,
		resourceId: string,
		page: number,
		pageSize: number,
	): Promise<AuditLogsPaginatedResult> {
		const where: Prisma.AuditLogWhereInput = {
			resourceType: resourceType as any,
			resourceId,
		}

		const [auditLogs, totalCount] = await Promise.all([
			this.prisma.auditLog.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip: (page - 1) * pageSize,
				take: pageSize,
			}),
			this.prisma.auditLog.count({ where }),
		])

		return {
			auditLogs: auditLogs.map(PrismaAuditLogMapper.toDomain),
			totalCount,
		}
	}
}
