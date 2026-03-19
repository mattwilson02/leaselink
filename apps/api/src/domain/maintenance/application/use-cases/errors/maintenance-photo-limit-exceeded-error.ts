import { MAX_MAINTENANCE_PHOTOS } from '@leaselink/shared'

export class MaintenancePhotoLimitExceededError extends Error {
	constructor() {
		super(`Cannot exceed ${MAX_MAINTENANCE_PHOTOS} photos per request`)
		this.name = 'MaintenancePhotoLimitExceededError'
	}
}
