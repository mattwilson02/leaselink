import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Document } from '../../enterprise/entities/document'
import { DocumentRepository } from '../repositories/document-repository'
import { DocumentNotFoundError } from './errors/document-not-found-error'
import { DocumentNotClientsError } from './errors/document-not-client-error'
import { DocumentFailedToViewError } from './errors/document-failed-to-view-error'
export interface ViewDocumentByIdUseCaseRequest {
	documentId: string
	clientId: string
}

type ViewDocumentByIdUseCaseResponse = Either<
	DocumentNotFoundError,
	{
		document: Document
	}
>

@Injectable()
export class ViewDocumentByIdUseCase {
	constructor(private documentRepository: DocumentRepository) {}

	async execute({
		documentId,
		clientId,
	}: ViewDocumentByIdUseCaseRequest): Promise<ViewDocumentByIdUseCaseResponse> {
		const document = await this.documentRepository.getById(documentId)

		if (!document) {
			return left(new DocumentNotFoundError(documentId))
		}

		if (document.clientId.toString() !== clientId) {
			return left(new DocumentNotClientsError(documentId, clientId))
		}

		const response = await this.documentRepository.viewDocument(
			clientId,
			documentId,
		)

		if (!response) {
			return left(new DocumentFailedToViewError(documentId))
		}

		return right({
			document: response,
		})
	}
}
