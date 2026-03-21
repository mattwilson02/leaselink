import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { MaintenanceRequest } from '@/domain/maintenance/enterprise/entities/maintenance-request'
import { MaintenanceStatus } from '@/domain/maintenance/enterprise/entities/value-objects/maintenance-status'
import { MaintenancePriority } from '@/domain/maintenance/enterprise/entities/value-objects/maintenance-priority'
import { MaintenanceCategory } from '@/domain/maintenance/enterprise/entities/value-objects/maintenance-category'
import {
	Prisma,
	MaintenanceRequest as PrismaMaintenanceRequest,
} from '@prisma/client'

export class PrismaMaintenanceRequestMapper {
	static toDomain(raw: PrismaMaintenanceRequest): MaintenanceRequest {
		return MaintenanceRequest.create(
			{
				propertyId: new UniqueEntityId(raw.propertyId),
				tenantId: new UniqueEntityId(raw.tenantId),
				vendorId: raw.vendorId ? new UniqueEntityId(raw.vendorId) : null,
				title: raw.title,
				description: raw.description,
				priority: MaintenancePriority.create(raw.priority),
				status: MaintenanceStatus.create(raw.status),
				category: MaintenanceCategory.create(raw.category),
				photos: raw.photos,
				resolvedAt: raw.resolvedAt,
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt,
			},
			new UniqueEntityId(raw.id),
		)
	}

	static toPrisma(
		request: MaintenanceRequest,
	): Prisma.MaintenanceRequestUncheckedCreateInput {
		return {
			id: request.id.toString(),
			propertyId: request.propertyId.toString(),
			tenantId: request.tenantId.toString(),
			vendorId: request.vendorId?.toString() ?? null,
			title: request.title,
			description: request.description,
			priority: request.priority as any,
			status: request.status as any,
			category: request.category as any,
			photos: request.photos,
			resolvedAt: request.resolvedAt,
			createdAt: request.createdAt,
			updatedAt: request.updatedAt ?? undefined,
		}
	}
}
