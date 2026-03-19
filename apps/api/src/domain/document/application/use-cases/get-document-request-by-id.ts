import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DocumentRequest } from '../../enterprise/entities/document-request'
import { DocumentRequestRepository } from '../repositories/document-request-repository'
import { DocumentRequestByIdNotFoundError } from './errors/document-request-by-id-not-found-error'

interface GetDocumentRequestByIdUseCaseRequest {
	id: string
}

type GetDocumentRequestByIdUseCaseResponse = Either<
	DocumentRequestByIdNotFoundError,
	{ documentRequest: DocumentRequest }
>

@Injectable()
export class GetDocumentRequestByIdUseCase {
	constructor(private documentRequestRepository: DocumentRequestRepository) {}

	async execute({
		id,
	}: GetDocumentRequestByIdUseCaseRequest): Promise<GetDocumentRequestByIdUseCaseResponse> {
		const documentRequest = await this.documentRequestRepository.getById(id)

		if (!documentRequest) {
			return left(new DocumentRequestByIdNotFoundError(id))
		}

		return right({ documentRequest })
	}
}
