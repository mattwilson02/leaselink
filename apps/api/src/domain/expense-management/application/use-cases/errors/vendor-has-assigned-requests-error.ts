import { UseCaseError } from '@/core/errors/use-case-error'
import { VENDOR_HAS_ASSIGNED_REQUESTS } from '@leaselink/shared'

export class VendorHasAssignedRequestsError
	extends Error
	implements UseCaseError
{
	message = VENDOR_HAS_ASSIGNED_REQUESTS

	constructor() {
		super(VENDOR_HAS_ASSIGNED_REQUESTS)
	}
}
