import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Document } from '../../enterprise/entities/document'
import { DocumentRepository } from '../repositories/document-repository'
import { DocumentFolderType } from '../../enterprise/entities/value-objects/document-folders'

export interface GetManyDocumentsByClientIdUseCaseRequest {
	clientId: string
	offset?: number
	limit?: number
	search?: string
	createdAtFrom?: Date
	createdAtTo?: Date
	folders?: DocumentFolderType[]
}

type GetManyDocumentsByClientIdUseCaseResponse = Either<
	null,
	{
		documents: Document[]
		totalCount: number
	}
>

@Injectable()
export class GetManyDocumentsByClientIdUseCase {
	constructor(private documentRepository: DocumentRepository) {}

	async execute({
		clientId,
		offset = 0,
		limit = 10,
		search,
		createdAtFrom,
		createdAtTo,
		folders,
	}: GetManyDocumentsByClientIdUseCaseRequest): Promise<GetManyDocumentsByClientIdUseCaseResponse> {
		const [documents, totalCount] = await Promise.all([
			this.documentRepository.getManyByClientId(
				clientId,
				offset,
				limit,
				search,
				createdAtFrom,
				createdAtTo,
				folders,
			),
			this.documentRepository.countByClientId(
				clientId,
				search,
				createdAtFrom,
				createdAtTo,
				folders,
			),
		])

		if (!documents || documents.length === 0) {
			return right({
				documents: [],
				totalCount: 0,
			})
		}

		return right({
			documents,
			totalCount,
		})
	}
}
