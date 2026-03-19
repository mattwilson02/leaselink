import type { MaintenanceRequest } from '@/domain/maintenance/enterprise/entities/maintenance-request'

export interface MaintenanceRequestsFilterParams {
	status?: string
	priority?: string
	category?: string
	propertyId?: string
	managerId?: string
	page: number
	pageSize: number
}

export interface MaintenanceRequestsByPropertyParams {
	propertyId: string
	status?: string
	page: number
	pageSize: number
}

export interface MaintenanceRequestsByTenantParams {
	tenantId: string
	status?: string
	page: number
	pageSize: number
}

export interface MaintenanceRequestsPaginatedResult {
	requests: MaintenanceRequest[]
	totalCount: number
}

export abstract class MaintenanceRequestsRepository {
	abstract create(request: MaintenanceRequest): Promise<void>
	abstract findById(requestId: string): Promise<MaintenanceRequest | null>
	abstract findMany(
		params: MaintenanceRequestsFilterParams,
	): Promise<MaintenanceRequestsPaginatedResult>
	abstract findManyByProperty(
		params: MaintenanceRequestsByPropertyParams,
	): Promise<MaintenanceRequestsPaginatedResult>
	abstract findManyByTenant(
		params: MaintenanceRequestsByTenantParams,
	): Promise<MaintenanceRequestsPaginatedResult>
	abstract update(request: MaintenanceRequest): Promise<MaintenanceRequest>
}
