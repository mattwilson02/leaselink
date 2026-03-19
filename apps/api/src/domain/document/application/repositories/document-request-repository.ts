import { Either } from '@/core/either'
import { DocumentRequest } from '../../enterprise/entities/document-request'

export abstract class DocumentRequestRepository {
	abstract getManyByClientId(
		clientId: string,
		limit: number,
		offset: number,
		requestType?: string,
	): Promise<DocumentRequest[] | null>
	abstract getById(id: string): Promise<DocumentRequest | null>
	abstract create(
		documentRequest: DocumentRequest,
	): Promise<DocumentRequest | null>
	abstract update(
		documentRequest: DocumentRequest,
	): Promise<Either<Error, DocumentRequest>>
}
