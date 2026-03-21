import type {
	VendorsRepository,
	VendorsFilterParams,
	VendorsPaginatedResult,
} from '@/domain/expense-management/application/repositories/vendors-repository'
import type { Vendor } from '@/domain/expense-management/enterprise/entities/vendor'

export class InMemoryVendorsRepository implements VendorsRepository {
	public items: Vendor[] = []
	// Track which vendors have open requests for delete tests
	public vendorIdsWithOpenRequests: Set<string> = new Set()

	async create(vendor: Vendor): Promise<void> {
		this.items.push(vendor)
	}

	async findById(vendorId: string): Promise<Vendor | null> {
		return this.items.find((v) => v.id.toString() === vendorId) ?? null
	}

	async findManyByManager(
		params: VendorsFilterParams,
	): Promise<VendorsPaginatedResult> {
		let filtered = this.items.filter(
			(v) => v.managerId.toString() === params.managerId,
		)

		if (params.specialty) {
			filtered = filtered.filter((v) => v.specialty === params.specialty)
		}

		if (params.search) {
			const search = params.search.toLowerCase()
			filtered = filtered.filter(
				(v) =>
					v.name.toLowerCase().includes(search) ||
					(v.email?.toLowerCase().includes(search) ?? false),
			)
		}

		const totalCount = filtered.length
		const start = (params.page - 1) * params.pageSize
		const paginated = filtered.slice(start, start + params.pageSize)

		return { vendors: paginated, totalCount }
	}

	async update(vendor: Vendor): Promise<Vendor> {
		const index = this.items.findIndex(
			(v) => v.id.toString() === vendor.id.toString(),
		)
		if (index !== -1) {
			this.items[index] = vendor
		}
		return vendor
	}

	async delete(vendorId: string): Promise<void> {
		this.items = this.items.filter((v) => v.id.toString() !== vendorId)
	}

	async hasOpenMaintenanceRequests(vendorId: string): Promise<boolean> {
		return this.vendorIdsWithOpenRequests.has(vendorId)
	}
}
