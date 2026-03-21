import { Vendor } from '@/domain/expense-management/enterprise/entities/vendor'

export interface VendorHttpResponse {
	id: string
	managerId: string
	name: string
	specialty: string
	phone: string | null
	email: string | null
	notes: string | null
	createdAt: string
	updatedAt: string | null
}

export class HttpVendorPresenter {
	static toHTTP(vendor: Vendor): VendorHttpResponse {
		return {
			id: vendor.id.toString(),
			managerId: vendor.managerId.toString(),
			name: vendor.name,
			specialty: vendor.specialty,
			phone: vendor.phone,
			email: vendor.email,
			notes: vendor.notes,
			createdAt:
				vendor.createdAt instanceof Date
					? vendor.createdAt.toISOString()
					: vendor.createdAt,
			updatedAt: vendor.updatedAt
				? vendor.updatedAt instanceof Date
					? vendor.updatedAt.toISOString()
					: vendor.updatedAt
				: null,
		}
	}

	static toHTTPList(vendors: Vendor[]): VendorHttpResponse[] {
		return vendors.map(HttpVendorPresenter.toHTTP)
	}
}
