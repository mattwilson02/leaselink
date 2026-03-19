import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { DocumentRepository } from '../repositories/document-repository'
import { DocumentsByClientIdNotFoundError } from './errors/documents-by-client-id-not-found-error'
import { ClientsRepository } from '@/domain/financial-management/application/repositories/clients-repository'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'

export interface GetDocumentsByFolderUseCaseRequest {
	clientId: string
}

export type FolderSummary = {
	folderName: string
	fileCount: number
	totalFileSizeSum: number
	mostRecentUpdatedDate: Date | null
}

type GetDocumentsByFolderUseCaseResponse = Either<
	DocumentsByClientIdNotFoundError | ClientNotFoundError,
	FolderSummary[]
>

@Injectable()
export class GetDocumentFolderSummaryUseCase {
	constructor(
		private documentRepository: DocumentRepository,
		private clientsRepository: ClientsRepository,
	) {}

	async execute({
		clientId,
	}: GetDocumentsByFolderUseCaseRequest): Promise<GetDocumentsByFolderUseCaseResponse> {
		const clientFound = await this.clientsRepository.findById(clientId)

		if (!clientFound) {
			return left(new ClientNotFoundError())
		}

		const documentsGroupedByDocumentType =
			await this.documentRepository.getManyByClientIdGroupedByDocumentType(
				clientId,
			)

		if (
			!documentsGroupedByDocumentType ||
			documentsGroupedByDocumentType.length === 0
		) {
			return left(new DocumentsByClientIdNotFoundError(clientId))
		}

		return right(documentsGroupedByDocumentType)
	}
}
