import { UseCaseError } from '@/core/errors/use-case-error'
import { FORBIDDEN } from '@leaselink/shared'

export class LeaseForbiddenError extends Error implements UseCaseError {
	constructor() {
		super(FORBIDDEN)
	}
}
