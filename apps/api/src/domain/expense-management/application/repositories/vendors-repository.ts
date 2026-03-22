import type { Vendor } from '../../enterprise/entities/vendor'

export interface VendorsFilterParams {
	managerId: string
	specialty?: string
	search?: string
	page: number
	pageSize: number
}

export interface VendorsPaginatedResult {
	vendors: Vendor[]
	totalCount: number
}

export abstract class VendorsRepository {
	abstract create(vendor: Vendor): Promise<void>
	abstract findById(vendorId: string): Promise<Vendor | null>
	abstract findManyByManager(
		params: VendorsFilterParams,
	): Promise<VendorsPaginatedResult>
	abstract update(vendor: Vendor): Promise<Vendor>
	abstract delete(vendorId: string): Promise<void>
	abstract hasOpenMaintenanceRequests(vendorId: string): Promise<boolean>
}
