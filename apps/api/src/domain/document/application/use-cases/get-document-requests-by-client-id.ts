import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DocumentRequest } from '../../enterprise/entities/document-request'
import { DocumentRequestRepository } from '../repositories/document-request-repository'
import { DocumentRequestsByClientIdNotFoundError } from './errors/document-requests-by-client-id-not-found-error'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { ClientsRepository } from '@/domain/financial-management/application/repositories/clients-repository'

interface GetDocumentRequestByClientIdUseCaseRequest {
	clientId: string
	requestType?: string
	limit?: number
	offset?: number
}

type GetDocumentRequestByClientIdUseCaseResponse = Either<
	DocumentRequestsByClientIdNotFoundError,
	{ documentRequestsByClientId: DocumentRequest[] }
>

@Injectable()
export class GetDocumentRequestsByClientIdUseCase {
	constructor(
		private documentRequestRepository: DocumentRequestRepository,
		private clientsRepository: ClientsRepository,
	) {}

	async execute({
		clientId,
		limit = 10,
		offset = 0,
		requestType,
	}: GetDocumentRequestByClientIdUseCaseRequest): Promise<GetDocumentRequestByClientIdUseCaseResponse> {
		const clientFound = await this.clientsRepository.findById(clientId)

		if (!clientFound) {
			return left(new ClientNotFoundError())
		}

		const documentRequestsByClientId =
			await this.documentRequestRepository.getManyByClientId(
				clientId,
				limit,
				offset,
				requestType,
			)

		if (!documentRequestsByClientId) {
			return left(new DocumentRequestsByClientIdNotFoundError(clientId))
		}

		return right({ documentRequestsByClientId })
	}
}
