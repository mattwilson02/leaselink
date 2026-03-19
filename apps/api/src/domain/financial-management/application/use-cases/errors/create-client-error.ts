import { UseCaseError } from '@/core/errors/use-case-error'

export class CreateClientError extends Error implements UseCaseError {
	constructor() {
		super('Error while creating a client.')
	}
}
