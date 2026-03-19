import type {
	PropertiesRepository,
	PropertiesFilterParams,
	PropertiesPaginatedResult,
} from '@/domain/property-management/application/repositories/properties-repository'
import type { Property } from '@/domain/property-management/enterprise/entities/property'

export class InMemoryPropertiesRepository implements PropertiesRepository {
	public items: Property[] = []
	public activeLeasePropertyIds: Set<string> = new Set()

	async create(property: Property): Promise<void> {
		this.items.push(property)
	}

	async findById(propertyId: string): Promise<Property | null> {
		return this.items.find((p) => p.id.toString() === propertyId) ?? null
	}

	async findManyByManager(
		params: PropertiesFilterParams,
	): Promise<PropertiesPaginatedResult> {
		let filtered = this.items.filter(
			(p) => p.managerId.toString() === params.managerId,
		)

		if (params.status) {
			filtered = filtered.filter((p) => p.status === params.status)
		}

		if (params.search) {
			const search = params.search.toLowerCase()
			filtered = filtered.filter(
				(p) =>
					p.address.toLowerCase().includes(search) ||
					p.city.toLowerCase().includes(search),
			)
		}

		const totalCount = filtered.length
		const start = (params.page - 1) * params.pageSize
		const paginated = filtered.slice(start, start + params.pageSize)

		return { properties: paginated, totalCount }
	}

	async update(property: Property): Promise<Property> {
		const index = this.items.findIndex(
			(p) => p.id.toString() === property.id.toString(),
		)
		if (index !== -1) {
			this.items[index] = property
		}
		return property
	}

	async delete(propertyId: string): Promise<void> {
		this.items = this.items.filter((p) => p.id.toString() !== propertyId)
	}

	async hasActiveLease(propertyId: string): Promise<boolean> {
		return this.activeLeasePropertyIds.has(propertyId)
	}
}
