import { UseCaseError } from '@/core/errors/use-case-error'
import { LEASE_RENEWAL_INVALID_SOURCE } from '@leaselink/shared'

export class LeaseRenewalInvalidSourceError
	extends Error
	implements UseCaseError
{
	constructor() {
		super(LEASE_RENEWAL_INVALID_SOURCE)
	}
}
