import type { Either } from '@/core/either'

export interface BlobInfo {
	name: string
	size: number
	lastModified: Date
	contentType: string
}

export interface DownloadUrlResult {
	success: boolean
	downloadUrl: string
	blobName: string
	expiresOn: string
}

export interface GenerateDownloadUrlParams {
	blobName: string
}

export abstract class StorageRepository {
	abstract generateUploadUrl(
		fileName: string,
		contentType?: string,
	): Promise<Either<Error, string>>

	abstract generateDownloadUrl(
		params: GenerateDownloadUrlParams,
	): Promise<Either<Error, DownloadUrlResult>>

	abstract deleteBlob(blobName: string): Promise<void>

	abstract blobExists(blobName: string): Promise<boolean>

	abstract getBlobInfo(blobName: string): Promise<BlobInfo | null>
}
