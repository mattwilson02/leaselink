import { UseCaseError } from '@/core/errors/use-case-error'
import { LEASE_ACTIVATION_FUTURE_START } from '@leaselink/shared'

export class LeaseActivationFutureStartError
	extends Error
	implements UseCaseError
{
	constructor() {
		super(LEASE_ACTIVATION_FUTURE_START)
	}
}
