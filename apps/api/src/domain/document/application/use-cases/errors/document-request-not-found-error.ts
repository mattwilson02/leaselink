import { UseCaseError } from '@/core/errors/use-case-error'

export class DocumentRequestNotFoundError
	extends Error
	implements UseCaseError
{
	constructor() {
		super('Document request not found.')
	}
}
