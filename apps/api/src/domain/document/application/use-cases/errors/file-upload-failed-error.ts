import { UseCaseError } from '@/core/errors/use-case-error'

export class FileUploadFailedError extends Error implements UseCaseError {
	constructor(blobKey: string, reason: string) {
		super(`File upload failed for blob key '${blobKey}': ${reason}`)
		this.name = 'FileUploadFailedError'
	}
}
