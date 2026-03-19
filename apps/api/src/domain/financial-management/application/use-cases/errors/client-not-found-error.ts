import { UseCaseError } from '@/core/errors/use-case-error'

export class ClientNotFoundError extends Error implements UseCaseError {
	constructor() {
		super('Client not found.')
	}
}
