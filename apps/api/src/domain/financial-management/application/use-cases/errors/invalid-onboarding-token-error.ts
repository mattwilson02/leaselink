import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidOnboardingTokenError extends Error implements UseCaseError {
	constructor() {
		super('Invalid onboarding token.')
	}
}
