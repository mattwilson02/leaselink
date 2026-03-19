import type {
	MaintenanceRequestsRepository,
	MaintenanceRequestsFilterParams,
	MaintenanceRequestsByPropertyParams,
	MaintenanceRequestsByTenantParams,
	MaintenanceRequestsPaginatedResult,
} from '@/domain/maintenance/application/repositories/maintenance-requests-repository'
import type { MaintenanceRequest } from '@/domain/maintenance/enterprise/entities/maintenance-request'

export class InMemoryMaintenanceRequestsRepository
	implements MaintenanceRequestsRepository
{
	public items: MaintenanceRequest[] = []

	async create(request: MaintenanceRequest): Promise<void> {
		this.items.push(request)
	}

	async findById(requestId: string): Promise<MaintenanceRequest | null> {
		return this.items.find((r) => r.id.toString() === requestId) ?? null
	}

	async findMany(
		params: MaintenanceRequestsFilterParams,
	): Promise<MaintenanceRequestsPaginatedResult> {
		let filtered = [...this.items]

		if (params.managerId) {
			// Filter by manager — use propertyIds stored in the repo
			// In tests, we rely on propertyId matching
		}

		if (params.status) {
			filtered = filtered.filter((r) => r.status === params.status)
		}

		if (params.priority) {
			filtered = filtered.filter((r) => r.priority === params.priority)
		}

		if (params.category) {
			filtered = filtered.filter((r) => r.category === params.category)
		}

		if (params.propertyId) {
			filtered = filtered.filter(
				(r) => r.propertyId.toString() === params.propertyId,
			)
		}

		filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

		const totalCount = filtered.length
		const start = (params.page - 1) * params.pageSize
		const paginated = filtered.slice(start, start + params.pageSize)

		return { requests: paginated, totalCount }
	}

	async findManyByProperty(
		params: MaintenanceRequestsByPropertyParams,
	): Promise<MaintenanceRequestsPaginatedResult> {
		let filtered = this.items.filter(
			(r) => r.propertyId.toString() === params.propertyId,
		)

		if (params.status) {
			filtered = filtered.filter((r) => r.status === params.status)
		}

		filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

		const totalCount = filtered.length
		const start = (params.page - 1) * params.pageSize
		const paginated = filtered.slice(start, start + params.pageSize)

		return { requests: paginated, totalCount }
	}

	async findManyByTenant(
		params: MaintenanceRequestsByTenantParams,
	): Promise<MaintenanceRequestsPaginatedResult> {
		let filtered = this.items.filter(
			(r) => r.tenantId.toString() === params.tenantId,
		)

		if (params.status) {
			filtered = filtered.filter((r) => r.status === params.status)
		}

		filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

		const totalCount = filtered.length
		const start = (params.page - 1) * params.pageSize
		const paginated = filtered.slice(start, start + params.pageSize)

		return { requests: paginated, totalCount }
	}

	async update(request: MaintenanceRequest): Promise<MaintenanceRequest> {
		const index = this.items.findIndex(
			(r) => r.id.toString() === request.id.toString(),
		)
		if (index !== -1) {
			this.items[index] = request
		}
		return request
	}
}
