import { UseCaseError } from '@/core/errors/use-case-error'
import { LEASE_RENEWAL_START_DATE_INVALID } from '@leaselink/shared'

export class LeaseRenewalStartDateInvalidError
	extends Error
	implements UseCaseError
{
	constructor() {
		super(LEASE_RENEWAL_START_DATE_INVALID)
	}
}
