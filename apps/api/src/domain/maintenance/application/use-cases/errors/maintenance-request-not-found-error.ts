import { MAINTENANCE_NOT_FOUND } from '@leaselink/shared'

export class MaintenanceRequestNotFoundError extends Error {
	constructor() {
		super(MAINTENANCE_NOT_FOUND)
		this.name = 'MaintenanceRequestNotFoundError'
	}
}
