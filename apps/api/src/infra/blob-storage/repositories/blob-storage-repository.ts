import { Injectable } from '@nestjs/common'
import {
	StorageRepository,
	BlobInfo,
	DownloadUrlResult,
	GenerateDownloadUrlParams,
} from '@/domain/document/application/repositories/storage-repository'
import { BlobStorageService } from '../blob-storage.service'
import { Either, right, left } from '@/core/either'
import {
	generateBlobSASQueryParameters,
	BlobSASPermissions,
} from '@azure/storage-blob'
import { BlobDoesNotExistError } from '@/domain/document/application/use-cases/errors/blob-does-not-exist-error'
import { FileUploadFailedError } from '@/domain/document/application/use-cases/errors/file-upload-failed-error'

export interface UploadUrlResult {
	success: boolean
	uploadUrl: string
	blobName: string
	expiresOn: string
}

export interface GenerateUploadUrlParams {
	fileName: string
	contentType?: string
}

@Injectable()
export class BlobStorageRepository implements StorageRepository {
	constructor(private readonly blobStorageService: BlobStorageService) {}

	async generateUploadUrl(
		fileName: string,
		contentType?: string,
	): Promise<Either<Error, string>> {
		try {
			const result = await this.generateUploadUrlWithDetails({
				fileName,
				contentType,
			})
			return right(result.uploadUrl)
		} catch (error) {
			return left(new FileUploadFailedError(fileName, error.message))
		}
	}

	private async generateUploadUrlWithDetails(
		params: GenerateUploadUrlParams,
	): Promise<UploadUrlResult> {
		const sharedKeyCredential =
			await this.blobStorageService.getSharedKeyCredential()
		const containerName = this.blobStorageService.getContainerName()
		const blobEndpoint = this.blobStorageService.getBlobStorageEndpoint()

		const blobName = params.fileName.includes('/')
			? params.fileName
			: `${Date.now()}-${params.fileName}`

		const expiresOn = new Date()
		expiresOn.setHours(expiresOn.getHours() + 1)

		const sasToken = generateBlobSASQueryParameters(
			{
				containerName,
				blobName,
				permissions: BlobSASPermissions.parse('w'),
				expiresOn,
			},
			sharedKeyCredential,
		).toString()

		const uploadUrl = `${blobEndpoint}/${containerName}/${blobName}?${sasToken}`

		return {
			success: true,
			uploadUrl,
			blobName,
			expiresOn: expiresOn.toISOString(),
		}
	}

	async generateDownloadUrl(
		params: GenerateDownloadUrlParams,
	): Promise<Either<Error, DownloadUrlResult>> {
		const sharedKeyCredential =
			await this.blobStorageService.getSharedKeyCredential()
		const containerName = this.blobStorageService.getContainerName()
		const blobEndpoint = this.blobStorageService.getBlobStorageEndpoint()

		const doesExist = await this.blobExists(params.blobName)

		if (!doesExist) return left(new BlobDoesNotExistError(params.blobName))

		const expiresOn = new Date()
		expiresOn.setMinutes(expiresOn.getMinutes() + 15)

		const sasToken = generateBlobSASQueryParameters(
			{
				containerName,
				blobName: params.blobName,
				permissions: BlobSASPermissions.parse('r'),
				expiresOn,
			},
			sharedKeyCredential,
		).toString()

		const downloadUrl = `${blobEndpoint}/${containerName}/${params.blobName}?${sasToken}`

		return right({
			success: true,
			downloadUrl,
			blobName: params.blobName,
			expiresOn: expiresOn.toISOString(),
		})
	}

	async deleteBlob(blobName: string): Promise<void> {
		const containerClient = await this.blobStorageService.getContainerClient()
		const blobClient = containerClient.getBlobClient(blobName)
		await blobClient.deleteIfExists()
	}

	async blobExists(blobName: string): Promise<boolean> {
		const containerClient = await this.blobStorageService.getContainerClient()
		const blobClient = containerClient.getBlobClient(blobName)
		return await blobClient.exists()
	}

	async getBlobInfo(blobName: string): Promise<BlobInfo | null> {
		try {
			const containerClient = await this.blobStorageService.getContainerClient()
			const blobClient = containerClient.getBlobClient(blobName)
			const properties = await blobClient.getProperties()

			return {
				name: blobName,
				size: properties.contentLength || 0,
				lastModified: properties.lastModified || new Date(),
				contentType: properties.contentType || 'application/octet-stream',
			}
		} catch {
			return null
		}
	}
}
