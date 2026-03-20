import { Property } from '@/domain/property-management/enterprise/entities/property'

export interface PropertyHttpResponse {
	id: string
	managerId: string
	address: string
	city: string
	state: string
	zipCode: string
	propertyType: string
	bedrooms: number
	bathrooms: number
	sqft: number | null
	rentAmount: number
	status: string
	description: string | null
	photos: string[]
	createdAt: string
	updatedAt: string | null
}

export class HttpPropertyPresenter {
	static toHTTP(
		property: Property,
		blobBaseUrl?: string,
	): PropertyHttpResponse {
		const photos = blobBaseUrl
			? property.photos.map((key) => `${blobBaseUrl}/${key}`)
			: property.photos
		return {
			id: property.id.toString(),
			managerId: property.managerId.toString(),
			address: property.address,
			city: property.city,
			state: property.state,
			zipCode: property.zipCode,
			propertyType: property.propertyType,
			bedrooms: property.bedrooms,
			bathrooms: property.bathrooms,
			sqft: property.sqft,
			rentAmount: property.rentAmount,
			status: property.status,
			description: property.description,
			photos,
			createdAt:
				property.createdAt instanceof Date
					? property.createdAt.toISOString()
					: property.createdAt,
			updatedAt: property.updatedAt
				? property.updatedAt instanceof Date
					? property.updatedAt.toISOString()
					: property.updatedAt
				: null,
		}
	}

	static toHTTPList(
		properties: Property[],
		blobBaseUrl?: string,
	): PropertyHttpResponse[] {
		return properties.map((p) => HttpPropertyPresenter.toHTTP(p, blobBaseUrl))
	}
}
