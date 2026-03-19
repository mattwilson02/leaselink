import { MAINTENANCE_ONLY_MANAGER_CAN_UPDATE_STATUS } from '@leaselink/shared'

export class MaintenanceOnlyManagerCanUpdateStatusError extends Error {
	constructor() {
		super(MAINTENANCE_ONLY_MANAGER_CAN_UPDATE_STATUS)
		this.name = 'MaintenanceOnlyManagerCanUpdateStatusError'
	}
}
