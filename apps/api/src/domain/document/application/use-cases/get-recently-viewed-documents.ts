import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Document } from '../../enterprise/entities/document'
import { DocumentRepository } from '../repositories/document-repository'
import { DocumentFolderType } from '../../enterprise/entities/value-objects/document-folders'

export interface GetRecentlyViewedDocumentsUseCaseRequest {
	clientId: string
	limit?: number
	folderName?: DocumentFolderType
}

type GetRecentlyViewedDocumentsUseCaseResponse = Either<
	null,
	{
		documents: Document[]
	}
>

@Injectable()
export class GetRecentlyViewedDocumentsUseCase {
	constructor(private documentRepository: DocumentRepository) {}

	async execute({
		clientId,
		limit = 10,
		folderName,
	}: GetRecentlyViewedDocumentsUseCaseRequest): Promise<GetRecentlyViewedDocumentsUseCaseResponse> {
		const documents = await this.documentRepository.getRecentlyViewedAt(
			clientId,
			limit,
			folderName,
		)

		if (!documents || documents.length === 0) {
			return right({
				documents: [],
			})
		}

		return right({
			documents,
		})
	}
}
