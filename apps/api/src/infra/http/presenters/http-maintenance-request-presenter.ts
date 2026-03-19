import { MaintenanceRequest } from '@/domain/maintenance/enterprise/entities/maintenance-request'

export interface MaintenanceRequestHttpResponse {
	id: string
	propertyId: string
	tenantId: string
	title: string
	description: string
	priority: string
	status: string
	category: string
	photos: string[]
	resolvedAt: string | null
	createdAt: string
	updatedAt: string | null
}

export class HttpMaintenanceRequestPresenter {
	static toHTTP(request: MaintenanceRequest): MaintenanceRequestHttpResponse {
		return {
			id: request.id.toString(),
			propertyId: request.propertyId.toString(),
			tenantId: request.tenantId.toString(),
			title: request.title,
			description: request.description,
			priority: request.priority,
			status: request.status,
			category: request.category,
			photos: request.photos,
			resolvedAt: request.resolvedAt ? request.resolvedAt.toISOString() : null,
			createdAt:
				request.createdAt instanceof Date
					? request.createdAt.toISOString()
					: request.createdAt,
			updatedAt: request.updatedAt
				? request.updatedAt instanceof Date
					? request.updatedAt.toISOString()
					: request.updatedAt
				: null,
		}
	}

	static toHTTPList(
		requests: MaintenanceRequest[],
	): MaintenanceRequestHttpResponse[] {
		return requests.map(HttpMaintenanceRequestPresenter.toHTTP)
	}
}
