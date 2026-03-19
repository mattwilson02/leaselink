import { Either, left, right } from '@/core/either'

import { Injectable, Optional } from '@nestjs/common'
import { Document } from '../../enterprise/entities/document'
import { DocumentRepository } from '../repositories/document-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DocumentFolder } from '../../enterprise/entities/value-objects/document-folders'
import { DocumentRequestRepository } from '../repositories/document-request-repository'
import { StorageRepository } from '../repositories/storage-repository'
import { DocumentRequestStatus } from '../../enterprise/entities/value-objects/document-request-status'
import { DocumentRequestNotFoundError } from './errors/document-request-not-found-error'
import { BlobDoesNotExistError } from './errors/blob-does-not-exist-error'
import { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import {
	ActionType,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'

export interface ConfirmUploadDocumentUseCaseRequest {
	blobName: string
	clientId: UniqueEntityId
	contentKey?: UniqueEntityId
	name: string
	fileSize: number
	thumbnailBlobName?: string | null
	folder: DocumentFolder
	uploadedBy: UniqueEntityId
	documentRequestId: UniqueEntityId
}

export type ConfirmUploadDocumentUseCaseResponse = Either<
	Error,
	{
		document: Document
	}
>

@Injectable()
export class ConfirmUploadDocumentUseCase {
	constructor(
		private documentRepository: DocumentRepository,
		private documentRequestRepository: DocumentRequestRepository,
		private blobStorageRepository: StorageRepository,
		@Optional()
		private createNotificationUseCase?: CreateNotificationUseCase,
	) {}

	async execute({
		blobName,
		clientId,
		contentKey,
		name,
		fileSize,
		thumbnailBlobName,
		folder,
		uploadedBy,
		documentRequestId,
	}: ConfirmUploadDocumentUseCaseRequest): Promise<ConfirmUploadDocumentUseCaseResponse> {
		const documentRequest = await this.documentRequestRepository.getById(
			documentRequestId.toString(),
		)

		if (!documentRequest) {
			return left(new DocumentRequestNotFoundError())
		}

		const uploadBlob = await this.blobStorageRepository.blobExists(blobName)

		if (!uploadBlob) {
			return left(new BlobDoesNotExistError(blobName))
		}

		let version = 1
		if (contentKey) {
			const existingVersions =
				await this.documentRepository.getManyByContentKey(contentKey.toString())

			const maxVersion = existingVersions?.reduce((max, doc) => {
				return doc.version > max ? doc.version : max
			}, 0)

			version = maxVersion ? maxVersion + 1 : 1
		}

		const document = Document.create({
			clientId: clientId,
			blobName: blobName,
			contentKey: contentKey ?? new UniqueEntityId(),
			version: version,
			name: name,
			fileSize: fileSize,
			thumbnailBlobName: thumbnailBlobName ?? null,
			folder: folder,
			uploadedBy: uploadedBy,
		})

		const result = await this.documentRepository.create(document)

		if (result.isLeft()) {
			return left(result.value)
		}

		documentRequest.documentId = document.id
		documentRequest.status = DocumentRequestStatus.create('UPLOADED')

		const updateDocumentRequestResult =
			await this.documentRequestRepository.update(documentRequest)

		if (updateDocumentRequestResult.isLeft()) {
			return left(updateDocumentRequestResult.value)
		}

		if (this.createNotificationUseCase) {
			await this.createNotificationUseCase.execute({
				personId: documentRequest.requestedBy.toString(),
				text: 'A document has been uploaded.',
				notificationType: NotificationType.INFO,
				actionType: ActionType.BASIC_COMPLETE,
				linkedDocumentId: result.value.id.toString(),
			})
		}

		return right({
			document: result.value,
		})
	}
}
