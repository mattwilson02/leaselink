import { UseCaseError } from '@/core/errors/use-case-error'

export class DocumentsByClientIdNotFoundError
	extends Error
	implements UseCaseError
{
	constructor(clientId: string) {
		super(`No documents found for client with ID ${clientId}`)
	}
}
