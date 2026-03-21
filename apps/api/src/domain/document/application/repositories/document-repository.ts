import { Either } from '@/core/either'
import { Document } from '../../enterprise/entities/document'
import { DocumentFolderType } from '../../enterprise/entities/value-objects/document-folders'

export interface FolderSummary {
	folderName: string
	fileCount: number
	totalFileSizeSum: number
	mostRecentUpdatedDate: Date | null
}

export abstract class DocumentRepository {
	abstract getManyByClientId(
		clientId: string,
		offset: number,
		limit: number,
		search?: string,
		createdAtFrom?: Date,
		createdAtTo?: Date,
		folders?: DocumentFolderType[],
	): Promise<Document[] | null>
	abstract countByClientId(
		clientId: string,
		search?: string,
		createdAtFrom?: Date,
		createdAtTo?: Date,
		folders?: DocumentFolderType[],
	): Promise<number>
	abstract getById(id: string): Promise<Document | null>
	abstract create(document: Document): Promise<Either<Error, Document>>
	abstract getManyByContentKey(contentKey: string): Promise<Document[] | null>
	abstract getManyByClientIdGroupedByDocumentType(
		clientId: string,
	): Promise<FolderSummary[] | null>
	abstract getAllGroupedByDocumentType(): Promise<FolderSummary[] | null>
	abstract getRecentlyViewedAt(
		clientId: string,
		limit?: number,
		folderName?: DocumentFolderType,
	): Promise<Document[] | null>
	abstract viewDocument(
		clientId: string,
		documentId: string,
	): Promise<Document | null>
}
