import { UseCaseError } from '@/core/errors/use-case-error'

export class PhotoLimitExceededError extends Error implements UseCaseError {
	constructor(
		currentCount: number,
		attemptedCount: number,
		maxAllowed: number,
	) {
		super(
			`Cannot exceed ${maxAllowed} photos per property. Current: ${currentCount}, attempting to add: ${attemptedCount}.`,
		)
		this.name = 'PhotoLimitExceededError'
	}
}
