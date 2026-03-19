import { UseCaseError } from '@/core/errors/use-case-error'

export class DocumentFailedToViewError extends Error implements UseCaseError {
	constructor(documentId?: string) {
		super(`Failed to view document with ID: ${documentId}.`)
	}
}
