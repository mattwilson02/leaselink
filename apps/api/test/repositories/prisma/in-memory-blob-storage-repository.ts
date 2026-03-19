import { Either, right, left } from '@/core/either'
import {
	BlobInfo,
	DownloadUrlResult,
	GenerateDownloadUrlParams,
	StorageRepository,
} from '@/domain/document/application/repositories/storage-repository'
import { BlobDoesNotExistError } from '@/domain/document/application/use-cases/errors/blob-does-not-exist-error'

type BlobFile = {
	blobName: string
	uploadUrl: string
	size: number
	lastModified: Date
	contentType: string
}

export class InMemoryBlobStorageRepository implements StorageRepository {
	public items: BlobFile[] = []

	async generateUploadUrl(
		fileName: string,
		contentType?: string,
	): Promise<Either<Error, string>> {
		try {
			const blobName = `${Date.now()}-${fileName}-${contentType || 'application/octet-stream'}`
			const uploadUrl = `https://example.com/upload/${blobName}`

			return right(uploadUrl)
		} catch (error) {
			return left(new Error(`Failed to generate upload URL: ${error.message}`))
		}
	}

	async generateDownloadUrl(
		params: GenerateDownloadUrlParams,
	): Promise<Either<Error, DownloadUrlResult>> {
		const { blobName } = params

		const exists = await this.blobExists(blobName)
		if (!exists) {
			return left(new BlobDoesNotExistError(blobName))
		}

		const expiresOn = new Date()
		expiresOn.setMinutes(expiresOn.getMinutes() + 15)

		const downloadUrl = `https://example.com/download/${blobName}`

		return right({
			success: true,
			downloadUrl,
			blobName,
			expiresOn: expiresOn.toISOString(),
		})
	}

	async deleteBlob(blobName: string): Promise<void> {
		this.items = this.items.filter((item) => item.blobName !== blobName)
	}

	async blobExists(blobName: string): Promise<boolean> {
		const exists = this.items.some((item) => item.blobName === blobName)
		return exists
	}

	async getBlobInfo(blobName: string): Promise<BlobInfo | null> {
		const item = this.items.find((item) => item.blobName === blobName)
		if (!item) {
			return null
		}
		return {
			name: item.blobName,
			size: item.size,
			lastModified: item.lastModified,
			contentType: item.contentType,
		}
	}
}
