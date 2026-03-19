import { UseCaseError } from '@/core/errors/use-case-error'

export class UpdateClientError extends Error implements UseCaseError {
	constructor() {
		super('Error while updating a client.')
	}
}
