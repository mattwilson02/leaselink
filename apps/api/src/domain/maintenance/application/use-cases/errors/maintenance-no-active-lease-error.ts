import { MAINTENANCE_NO_ACTIVE_LEASE } from '@leaselink/shared'

export class MaintenanceNoActiveLeaseError extends Error {
	constructor() {
		super(MAINTENANCE_NO_ACTIVE_LEASE)
		this.name = 'MaintenanceNoActiveLeaseError'
	}
}
