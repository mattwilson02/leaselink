import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaMaintenanceRequestMapper } from '../mappers/prisma-maintenance-request-mapper'
import type {
	MaintenanceRequestsRepository,
	MaintenanceRequestsFilterParams,
	MaintenanceRequestsByPropertyParams,
	MaintenanceRequestsByTenantParams,
	MaintenanceRequestsPaginatedResult,
} from '@/domain/maintenance/application/repositories/maintenance-requests-repository'
import type { MaintenanceRequest } from '@/domain/maintenance/enterprise/entities/maintenance-request'
import { Prisma } from '@prisma/client'

@Injectable()
export class PrismaMaintenanceRequestsRepository
	implements MaintenanceRequestsRepository
{
	constructor(private prisma: PrismaService) {}

	async create(request: MaintenanceRequest): Promise<void> {
		const data = PrismaMaintenanceRequestMapper.toPrisma(request)
		await this.prisma.maintenanceRequest.create({ data })
	}

	async findById(requestId: string): Promise<MaintenanceRequest | null> {
		const request = await this.prisma.maintenanceRequest.findUnique({
			where: { id: requestId },
		})
		if (!request) return null
		return PrismaMaintenanceRequestMapper.toDomain(request)
	}

	async findMany(
		params: MaintenanceRequestsFilterParams,
	): Promise<MaintenanceRequestsPaginatedResult> {
		const where: Prisma.MaintenanceRequestWhereInput = {}

		if (params.managerId) {
			where.property = { managerId: params.managerId }
		}

		if (params.status) {
			where.status = params.status as any
		}

		if (params.priority) {
			where.priority = params.priority as any
		}

		if (params.category) {
			where.category = params.category as any
		}

		if (params.propertyId) {
			where.propertyId = params.propertyId
		}

		if (params.tenantId) {
			where.tenantId = params.tenantId
		}

		const [requests, totalCount] = await Promise.all([
			this.prisma.maintenanceRequest.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip: (params.page - 1) * params.pageSize,
				take: params.pageSize,
			}),
			this.prisma.maintenanceRequest.count({ where }),
		])

		return {
			requests: requests.map(PrismaMaintenanceRequestMapper.toDomain),
			totalCount,
		}
	}

	async findManyByProperty(
		params: MaintenanceRequestsByPropertyParams,
	): Promise<MaintenanceRequestsPaginatedResult> {
		const where: Prisma.MaintenanceRequestWhereInput = {
			propertyId: params.propertyId,
		}

		if (params.status) {
			where.status = params.status as any
		}

		const [requests, totalCount] = await Promise.all([
			this.prisma.maintenanceRequest.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip: (params.page - 1) * params.pageSize,
				take: params.pageSize,
			}),
			this.prisma.maintenanceRequest.count({ where }),
		])

		return {
			requests: requests.map(PrismaMaintenanceRequestMapper.toDomain),
			totalCount,
		}
	}

	async findManyByTenant(
		params: MaintenanceRequestsByTenantParams,
	): Promise<MaintenanceRequestsPaginatedResult> {
		const where: Prisma.MaintenanceRequestWhereInput = {
			tenantId: params.tenantId,
		}

		if (params.status) {
			where.status = params.status as any
		}

		const [requests, totalCount] = await Promise.all([
			this.prisma.maintenanceRequest.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip: (params.page - 1) * params.pageSize,
				take: params.pageSize,
			}),
			this.prisma.maintenanceRequest.count({ where }),
		])

		return {
			requests: requests.map(PrismaMaintenanceRequestMapper.toDomain),
			totalCount,
		}
	}

	async update(request: MaintenanceRequest): Promise<MaintenanceRequest> {
		const data = PrismaMaintenanceRequestMapper.toPrisma(request)
		const updated = await this.prisma.maintenanceRequest.update({
			where: { id: request.id.toString() },
			data,
		})
		return PrismaMaintenanceRequestMapper.toDomain(updated)
	}
}
