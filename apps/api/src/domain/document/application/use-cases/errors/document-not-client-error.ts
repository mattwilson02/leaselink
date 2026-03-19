import { UseCaseError } from '@/core/errors/use-case-error'

export class DocumentNotClientsError extends Error implements UseCaseError {
	constructor(documentId?: string, clientId?: string) {
		super(
			`Document with ID: ${documentId} not found for client ID: ${clientId}`,
		)
	}
}
