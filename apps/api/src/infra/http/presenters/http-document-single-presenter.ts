import { Document } from '@/domain/document/enterprise/entities/document'
import { DocumentDTO } from '../DTOs/document/document-dto'

export class HttpDocumentSinglePresenter {
	static toHTTP(document: Document): DocumentDTO {
		return {
			id: document.id.toString(),
			name: document.name,
			contentKey: document.contentKey.toString(),
			uploadedBy: document.uploadedBy.toString(),
			blobName: document.blobName,
			fileSize: document.fileSize,
			thumbnailBlobName: document.thumbnailBlobName,
			folder: document.folder.value,
			clientId: document.clientId.toString(),
			version: document.version,
			createdAt: document.createdAt
				? document.createdAt instanceof Date
					? document.createdAt.toISOString()
					: document.createdAt
				: '',
			updatedAt: document.updatedAt
				? document.updatedAt instanceof Date
					? document.updatedAt.toISOString()
					: document.updatedAt
				: null,
			viewedAt: document.viewedAt
				? document.viewedAt instanceof Date
					? document.viewedAt.toISOString()
					: document.viewedAt
				: null,
		}
	}
}
