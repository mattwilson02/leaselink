import { UseCaseError } from '@/core/errors/use-case-error'
import { LEASE_TENANT_HAS_ACTIVE_LEASE } from '@leaselink/shared'

export class LeaseTenantHasActiveLeaseError
	extends Error
	implements UseCaseError
{
	constructor() {
		super(LEASE_TENANT_HAS_ACTIVE_LEASE)
	}
}
