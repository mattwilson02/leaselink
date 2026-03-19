import type { Property } from '@/domain/property-management/enterprise/entities/property'

export interface PropertiesFilterParams {
	managerId: string
	status?: string
	search?: string
	page: number
	pageSize: number
}

export interface PropertiesPaginatedResult {
	properties: Property[]
	totalCount: number
}

export abstract class PropertiesRepository {
	abstract create(property: Property): Promise<void>
	abstract findById(propertyId: string): Promise<Property | null>
	abstract findManyByManager(
		params: PropertiesFilterParams,
	): Promise<PropertiesPaginatedResult>
	abstract update(property: Property): Promise<Property>
	abstract delete(propertyId: string): Promise<void>
	abstract hasActiveLease(propertyId: string): Promise<boolean>
}
