import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Document } from '../../enterprise/entities/document'
import { DocumentRepository } from '../repositories/document-repository'
import { DocumentNotFoundError } from './errors/document-not-found-error'
import { StorageRepository } from '../repositories/storage-repository'

export interface GetDocumentByIdUseCaseRequest {
	documentId: string
}

export type DocumentWithThumbnailDownloadURL = Document & {
	thumbnailDownloadUrl?: string
}

type GetDocumentByIdUseCaseResponse = Either<
	DocumentNotFoundError,
	{
		document: DocumentWithThumbnailDownloadURL
	}
>

@Injectable()
export class GetDocumentByIdUseCase {
	constructor(
		private documentRepository: DocumentRepository,
		private blobStorageRepository: StorageRepository,
	) {}

	async execute({
		documentId,
	}: GetDocumentByIdUseCaseRequest): Promise<GetDocumentByIdUseCaseResponse> {
		const document = await this.documentRepository.getById(documentId)

		if (!document) {
			return left(new DocumentNotFoundError(documentId))
		}

		if (document.thumbnailBlobName !== null) {
			const thumbnailDownloadUrl =
				await this.blobStorageRepository.generateDownloadUrl({
					blobName: document.thumbnailBlobName,
				})
			if (thumbnailDownloadUrl.isRight()) {
				const newDocument = document as DocumentWithThumbnailDownloadURL
				newDocument.thumbnailDownloadUrl =
					thumbnailDownloadUrl.value.downloadUrl
				return right({
					document: newDocument,
				})
			}
		}

		return right({
			document,
		})
	}
}
