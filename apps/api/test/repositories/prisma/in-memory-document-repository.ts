import { Either, right } from '@/core/either'
import type {
	DocumentRepository,
	FolderSummary,
} from '@/domain/document/application/repositories/document-repository'
import type { Document } from '@/domain/document/enterprise/entities/document'
import { DocumentFolderType } from '@/domain/document/enterprise/entities/value-objects/document-folders'

export class InMemoryDocumentRepository implements DocumentRepository {
	public items: Document[] = []

	async getById(id: string): Promise<Document | null> {
		const document = this.items.find(
			(document) => document.id.toString() === id,
		)
		return Promise.resolve(document ?? null)
	}

	async getManyByClientId(
		clientId: string,
		offset = 0,
		limit = 10,
		search?: string,
		createdAtFrom?: Date,
		createdAtTo?: Date,
		folders?: DocumentFolderType[],
	): Promise<Document[]> {
		let documents = this.items.filter(
			(document) => document.clientId.toString() === clientId,
		)

		if (search) {
			const searchLower = search.toLowerCase()
			documents = documents.filter((doc) =>
				doc.name.toLowerCase().includes(searchLower),
			)
		}

		if (createdAtFrom) {
			documents = documents.filter((doc) => doc.createdAt >= createdAtFrom)
		}
		if (createdAtTo) {
			documents = documents.filter((doc) => doc.createdAt <= createdAtTo)
		}

		if (folders) {
			documents = documents.filter((doc) => folders.includes(doc.folder.value))
		}

		const latestDocumentsMap = new Map<string, Document>()
		for (const document of documents) {
			const existingDocument = latestDocumentsMap.get(
				document.contentKey.toString(),
			)
			if (!existingDocument || document.version > existingDocument.version) {
				latestDocumentsMap.set(document.contentKey.toString(), document)
			}
		}

		const latestDocuments = Array.from(latestDocumentsMap.values()).sort(
			(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
		)

		return Promise.resolve(latestDocuments.slice(offset, offset + limit))
	}

	async create(document: Document): Promise<Either<Error, Document>> {
		this.items.push(document)
		return Promise.resolve(right(document))
	}

	async getManyByContentKey(contentKey: string): Promise<Document[] | null> {
		const documents = this.items.filter(
			(document) => document.contentKey.toString() === contentKey,
		)

		return Promise.resolve(documents.length > 0 ? documents : null)
	}

	async getManyByClientIdGroupedByDocumentType(
		clientId: string,
	): Promise<FolderSummary[] | null> {
		const documents = this.items.filter(
			(document) => document.clientId.toString() === clientId,
		)
		if (documents.length === 0) {
			return null
		}

		// Group by folder
		const folderMap = new Map<
			string,
			{
				fileCount: number
				totalFileSizeSum: number
				mostRecentUpdatedDate: Date | null
			}
		>()

		for (const doc of documents) {
			const folder = doc.folder.value
			const fileSize = doc.fileSize ?? 0
			const updatedAt = doc.updatedAt ?? doc.createdAt
			const entry = folderMap.get(folder)
			if (!entry) {
				folderMap.set(folder, {
					fileCount: 1,
					totalFileSizeSum: fileSize,
					mostRecentUpdatedDate: updatedAt,
				})
			} else {
				entry.fileCount += 1
				entry.totalFileSizeSum += fileSize
				if (
					!entry.mostRecentUpdatedDate ||
					updatedAt > entry.mostRecentUpdatedDate
				) {
					entry.mostRecentUpdatedDate = updatedAt
				}
			}
		}

		return Array.from(folderMap.entries()).map(([folderName, data]) => ({
			folderName,
			fileCount: data.fileCount,
			totalFileSizeSum: data.totalFileSizeSum,
			mostRecentUpdatedDate: data.mostRecentUpdatedDate,
		}))
	}

	async getRecentlyViewedAt(
		clientId: string,
		limit = 10,
		folderName?: DocumentFolderType,
	): Promise<Document[] | null> {
		const documents = this.items.filter(
			(document) =>
				document.clientId.toString() === clientId &&
				document.viewedAt !== null &&
				(folderName ? document.folder.value === folderName : true),
		)

		if (documents.length === 0) {
			return null
		}

		// Get latest version for each contentKey
		const latestDocumentsMap = new Map<string, Document>()
		for (const document of documents) {
			const existingDocument = latestDocumentsMap.get(
				document.contentKey.toString(),
			)
			if (!existingDocument || document.version > existingDocument.version) {
				latestDocumentsMap.set(document.contentKey.toString(), document)
			}
		}

		// Sort by viewedAt descending and take limit
		const sortedDocuments = Array.from(latestDocumentsMap.values()).sort(
			(a, b) => {
				const aViewedAt = a.viewedAt?.getTime() ?? 0
				const bViewedAt = b.viewedAt?.getTime() ?? 0
				return bViewedAt - aViewedAt
			},
		)

		return sortedDocuments.slice(0, limit)
	}

	async viewDocument(
		clientId: string,
		documentId: string,
	): Promise<Document | null> {
		const document = this.items.find(
			(doc) =>
				doc.id.toString() === documentId &&
				doc.clientId.toString() === clientId,
		)
		if (document) {
			document.viewedAt = new Date()
		}

		return Promise.resolve(document || null)
	}
}
