import { UseCaseError } from '@/core/errors/use-case-error'
import { LEASE_PROPERTY_HAS_ACTIVE_LEASE } from '@leaselink/shared'

export class LeasePropertyHasActiveLeaseError
	extends Error
	implements UseCaseError
{
	constructor() {
		super(LEASE_PROPERTY_HAS_ACTIVE_LEASE)
	}
}
