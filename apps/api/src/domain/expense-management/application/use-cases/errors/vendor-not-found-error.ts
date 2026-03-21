import { UseCaseError } from '@/core/errors/use-case-error'
import { VENDOR_NOT_FOUND } from '@leaselink/shared'

export class VendorNotFoundError extends Error implements UseCaseError {
	message = VENDOR_NOT_FOUND

	constructor() {
		super(VENDOR_NOT_FOUND)
	}
}
