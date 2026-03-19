import { UseCaseError } from '@/core/errors/use-case-error'
import { LEASE_NOT_FOUND } from '@leaselink/shared'

export class LeaseNotFoundError extends Error implements UseCaseError {
	constructor() {
		super(LEASE_NOT_FOUND)
	}
}
