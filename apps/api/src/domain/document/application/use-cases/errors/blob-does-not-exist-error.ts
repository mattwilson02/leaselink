import { UseCaseError } from '@/core/errors/use-case-error'

export class BlobDoesNotExistError extends Error implements UseCaseError {
	constructor(blobName?: string) {
		super(`Blob with name: ${blobName} does not exist.`)
	}
}
