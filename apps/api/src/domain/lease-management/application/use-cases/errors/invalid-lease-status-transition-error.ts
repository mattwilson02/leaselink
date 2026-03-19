import { UseCaseError } from '@/core/errors/use-case-error'
import { LEASE_INVALID_STATUS_TRANSITION } from '@leaselink/shared'

export class InvalidLeaseStatusTransitionError
	extends Error
	implements UseCaseError
{
	constructor() {
		super(LEASE_INVALID_STATUS_TRANSITION)
	}
}
