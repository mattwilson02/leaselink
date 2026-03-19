import { UseCaseError } from '@/core/errors/use-case-error'

export class PasswordChangeError extends Error implements UseCaseError {
	constructor(message?: string) {
		super(message || 'Failed to change password.')
	}
}
