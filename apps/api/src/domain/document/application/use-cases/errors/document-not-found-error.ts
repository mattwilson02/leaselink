import { UseCaseError } from '@/core/errors/use-case-error'

export class DocumentNotFoundError extends Error implements UseCaseError {
	constructor(documentId?: string) {
		super(`Document with ID: ${documentId} not found.`)
	}
}
