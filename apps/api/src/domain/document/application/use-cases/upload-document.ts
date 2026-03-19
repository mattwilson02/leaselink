import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DocumentRequestRepository } from '../repositories/document-request-repository'
import { StorageRepository } from '../repositories/storage-repository'
import { DocumentRequestNotFoundError } from './errors/document-request-not-found-error'

export interface UploadDocumentUseCaseRequest {
	documentRequestId: UniqueEntityId
}

type UploadDocumentUseCaseResponse = Either<
	DocumentRequestNotFoundError,
	{
		uploadUrl: string
		thumbnailUploadUrl: string
	}
>

@Injectable()
export class UploadDocumentUseCase {
	constructor(
		private documentRequestRepository: DocumentRequestRepository,
		private blobStorageRepository: StorageRepository,
	) {}

	async execute({
		documentRequestId,
	}: UploadDocumentUseCaseRequest): Promise<UploadDocumentUseCaseResponse> {
		const documentRequest = await this.documentRequestRepository.getById(
			documentRequestId.toString(),
		)

		if (!documentRequest) {
			return left(new DocumentRequestNotFoundError())
		}

		const fileName = new UniqueEntityId()
		const result = await this.blobStorageRepository.generateUploadUrl(
			fileName.toString(),
		)

		if (result.isLeft()) {
			return left(result.value)
		}

		const thumbnailFileName = new UniqueEntityId()
		const thumbnailResult = await this.blobStorageRepository.generateUploadUrl(
			thumbnailFileName.toString(),
		)

		if (thumbnailResult.isLeft()) {
			return left(thumbnailResult.value)
		}

		return right({
			uploadUrl: result.value,
			thumbnailUploadUrl: thumbnailResult.value,
		})
	}
}
