import { UseCaseError } from '@/core/errors/use-case-error'

export class DocumentRequestsByClientIdNotFoundError
	extends Error
	implements UseCaseError
{
	constructor(clientId: string) {
		super(`No document requests found for client with ID ${clientId}`)
	}
}
