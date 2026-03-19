import { UseCaseError } from '@/core/errors/use-case-error'
import { LEASE_RENEWAL_ALREADY_EXISTS } from '@leaselink/shared'

export class LeaseRenewalAlreadyExistsError
	extends Error
	implements UseCaseError
{
	constructor() {
		super(LEASE_RENEWAL_ALREADY_EXISTS)
	}
}
