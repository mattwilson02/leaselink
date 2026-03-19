import { UseCaseError } from '@/core/errors/use-case-error'

export class DocumentRequestByIdNotFoundError
	extends Error
	implements UseCaseError
{
	constructor(documentRequestId?: string) {
		super(
			`Document request with documentRequestId: ${documentRequestId} not found.`,
		)
	}
}
