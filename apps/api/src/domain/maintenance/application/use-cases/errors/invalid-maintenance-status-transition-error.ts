export class InvalidMaintenanceStatusTransitionError extends Error {
	constructor(from: string, to: string) {
		super(`Invalid maintenance request status transition from ${from} to ${to}`)
		this.name = 'InvalidMaintenanceStatusTransitionError'
	}
}
