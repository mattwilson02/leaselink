import { Either, left, right } from '@/core/either'
import { Injectable, Optional } from '@nestjs/common'
import { DocumentRequest } from '../../enterprise/entities/document-request'
import { DocumentRequestRepository } from '../repositories/document-request-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DocumentRequestType } from '../../enterprise/entities/value-objects/document-request-type'
import { DocumentRequestStatus } from '../../enterprise/entities/value-objects/document-request-status'
import { CreateDocumentRequestError } from './errors/create-document-request-error'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { ClientsRepository } from '@/domain/financial-management/application/repositories/clients-repository'
import { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import {
	ActionType,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'
import {
	type DocumentRequestType as SharedDocumentRequestType,
	DOCUMENT_REQUEST_TYPE_LABELS,
} from '@leaselink/shared'

interface CreateDocumentRequestUseCaseRequest {
	clientId: string
	requestedBy: string
	requestType: string
}

type CreateDocumentRequestUseCaseResponse = Either<
	CreateDocumentRequestError,
	{ documentRequest: DocumentRequest }
>

@Injectable()
export class CreateDocumentRequestUseCase {
	constructor(
		private documentRequestRepository: DocumentRequestRepository,
		private clientsRepository: ClientsRepository,
		@Optional()
		private createNotificationUseCase?: CreateNotificationUseCase,
	) {}

	async execute({
		clientId,
		requestedBy,
		requestType,
	}: CreateDocumentRequestUseCaseRequest): Promise<CreateDocumentRequestUseCaseResponse> {
		const clientFound = await this.clientsRepository.findById(clientId)

		if (!clientFound) {
			return left(new ClientNotFoundError())
		}

		const documentRequest = DocumentRequest.create({
			clientId: new UniqueEntityId(clientId),
			requestedBy: new UniqueEntityId(requestedBy),
			requestType: DocumentRequestType.create(requestType),
			status: DocumentRequestStatus.create('PENDING'),
		})

		const created = await this.documentRequestRepository.create(documentRequest)

		if (!created) {
			return left(new CreateDocumentRequestError())
		}

		if (this.createNotificationUseCase) {
			await this.createNotificationUseCase.execute({
				personId: clientId,
				text: `You have a new document request: ${DOCUMENT_REQUEST_TYPE_LABELS[requestType as SharedDocumentRequestType] ?? requestType}. Please upload the required document.`,
				notificationType: NotificationType.ACTION,
				actionType: ActionType.UPLOAD_DOCUMENT,
				linkedDocumentId: created.id.toString(),
			})
		}

		return right({ documentRequest: created })
	}
}
