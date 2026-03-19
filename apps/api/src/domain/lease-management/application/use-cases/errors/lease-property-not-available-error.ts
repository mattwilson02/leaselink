import { UseCaseError } from '@/core/errors/use-case-error'
import { LEASE_PROPERTY_NOT_AVAILABLE } from '@leaselink/shared'

export class LeasePropertyNotAvailableError
	extends Error
	implements UseCaseError
{
	constructor() {
		super(LEASE_PROPERTY_NOT_AVAILABLE)
	}
}
