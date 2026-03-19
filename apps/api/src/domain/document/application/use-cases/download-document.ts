import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DocumentRepository } from '../repositories/document-repository'
import { StorageRepository } from '../repositories/storage-repository'
import { DocumentNotFoundError } from './errors/document-not-found-error'
import { BlobDoesNotExistError } from './errors/blob-does-not-exist-error'

export interface DownloadDocumentUseCaseRequest {
	documentId: string
}

type DownloadDocumentUseCaseResponse = Either<
	DocumentNotFoundError | BlobDoesNotExistError,
	{
		downloadUrl: string
		blobName: string
		expiresOn: string
	}
>

@Injectable()
export class DownloadDocumentUseCase {
	constructor(
		private documentRepository: DocumentRepository,
		private blobStorageRepository: StorageRepository,
	) {}

	async execute({
		documentId,
	}: DownloadDocumentUseCaseRequest): Promise<DownloadDocumentUseCaseResponse> {
		const document = await this.documentRepository.getById(documentId)

		if (!document) {
			return left(new DocumentNotFoundError(documentId.toString()))
		}

		const blobName = document.blobName

		const result = await this.blobStorageRepository.generateDownloadUrl({
			blobName,
		})

		if (result.isLeft()) {
			return left(new BlobDoesNotExistError(blobName))
		}

		const downloadResult = result.value

		return right({
			downloadUrl: downloadResult.downloadUrl,
			blobName: downloadResult.blobName,
			expiresOn: downloadResult.expiresOn,
		})
	}
}
