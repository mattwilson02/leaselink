import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidPasswordError extends Error implements UseCaseError {
	constructor() {
		super('The provided password is incorrect.')
	}
}
