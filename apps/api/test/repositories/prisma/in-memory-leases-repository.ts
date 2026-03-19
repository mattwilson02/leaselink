import type {
	LeasesRepository,
	LeasesFilterParams,
	LeasesPaginatedResult,
} from '@/domain/lease-management/application/repositories/leases-repository'
import type { Lease } from '@/domain/lease-management/enterprise/entities/lease'

export class InMemoryLeasesRepository implements LeasesRepository {
	public items: Lease[] = []

	async create(lease: Lease): Promise<void> {
		this.items.push(lease)
	}

	async findById(leaseId: string): Promise<Lease | null> {
		return this.items.find((l) => l.id.toString() === leaseId) ?? null
	}

	async findMany(params: LeasesFilterParams): Promise<LeasesPaginatedResult> {
		let filtered = [...this.items]

		if (params.status) {
			filtered = filtered.filter((l) => l.status === params.status)
		}

		if (params.propertyId) {
			filtered = filtered.filter(
				(l) => l.propertyId.toString() === params.propertyId,
			)
		}

		if (params.tenantId) {
			filtered = filtered.filter(
				(l) => l.tenantId.toString() === params.tenantId,
			)
		}

		const totalCount = filtered.length
		const start = (params.page - 1) * params.pageSize
		const paginated = filtered.slice(start, start + params.pageSize)

		return { leases: paginated, totalCount }
	}

	async findActiveByProperty(propertyId: string): Promise<Lease | null> {
		return (
			this.items.find(
				(l) => l.propertyId.toString() === propertyId && l.status === 'ACTIVE',
			) ?? null
		)
	}

	async findActiveByTenant(tenantId: string): Promise<Lease | null> {
		return (
			this.items.find(
				(l) => l.tenantId.toString() === tenantId && l.status === 'ACTIVE',
			) ?? null
		)
	}

	async findPendingRenewalByLeaseId(leaseId: string): Promise<Lease | null> {
		return (
			this.items.find(
				(l) =>
					l.renewedFromLeaseId?.toString() === leaseId &&
					l.status === 'PENDING',
			) ?? null
		)
	}

	async update(lease: Lease): Promise<Lease> {
		const index = this.items.findIndex(
			(l) => l.id.toString() === lease.id.toString(),
		)
		if (index !== -1) {
			this.items[index] = lease
		}
		return lease
	}
}
