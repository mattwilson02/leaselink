import { UseCaseError } from '@/core/errors/use-case-error'

export class PropertyHasActiveLeaseError extends Error implements UseCaseError {
	constructor(propertyId: string) {
		super(
			`Property "${propertyId}" cannot be deleted or set to VACANT while it has an active lease.`,
		)
	}
}
