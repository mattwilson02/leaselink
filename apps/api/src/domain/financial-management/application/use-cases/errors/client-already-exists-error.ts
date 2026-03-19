import { UseCaseError } from '@/core/errors/use-case-error'

export class ClientAlreadyExistsError extends Error implements UseCaseError {
	constructor(email: string) {
		super(`User with email: ${email} already exists.`)
	}
}
