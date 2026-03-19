import { UseCaseError } from '@/core/errors/use-case-error'

export class CreateDocumentRequestError extends Error implements UseCaseError {
	constructor() {
		super('Error while creating a document request.')
	}
}
