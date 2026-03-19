import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DocumentRequest } from '../../enterprise/entities/document-request'
import { DocumentRequestRepository } from '../repositories/document-request-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DocumentRequestType } from '../../enterprise/entities/value-objects/document-request-type'
import { DocumentRequestStatus } from '../../enterprise/entities/value-objects/document-request-status'
import { CreateDocumentRequestError } from './errors/create-document-request-error'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { ClientsRepository } from '@/domain/financial-management/application/repositories/clients-repository'

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

		return right({ documentRequest: created })
	}
}
