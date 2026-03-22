import type { Lease } from '@/domain/lease-management/enterprise/entities/lease'

export interface LeasesFilterParams {
	status?: string
	propertyId?: string
	tenantId?: string
	page: number
	pageSize: number
}

export interface LeasesPaginatedResult {
	leases: Lease[]
	totalCount: number
}

export abstract class LeasesRepository {
	abstract create(lease: Lease): Promise<void>
	abstract findById(leaseId: string): Promise<Lease | null>
	abstract findMany(params: LeasesFilterParams): Promise<LeasesPaginatedResult>
	abstract findActiveByProperty(propertyId: string): Promise<Lease | null>
	abstract findActiveByTenant(tenantId: string): Promise<Lease | null>
	abstract findPendingRenewalByLeaseId(leaseId: string): Promise<Lease | null>
	abstract update(lease: Lease): Promise<Lease>
	abstract findActiveExpiringBetween(
		startDate: Date,
		endDate: Date,
	): Promise<Lease[]>
	abstract findAllActive(): Promise<Lease[]>
	abstract findPendingByStartDateBefore(date: Date): Promise<Lease[]>
}
