import { DocumentWithThumbnailDownloadURL } from '@/domain/document/application/use-cases/get-document-by-id'
import { GetDocumentWithDownloadUrlResponseDTO } from '../DTOs/document/get-document-with-download-url-response-dto'

export class HttpDocumentSingleWithUrlPresenter {
	static toHTTP(
		document: DocumentWithThumbnailDownloadURL,
	): GetDocumentWithDownloadUrlResponseDTO {
		return {
			id: document.id.toString(),
			name: document.name,
			contentKey: document.contentKey.toString(),
			uploadedBy: document.uploadedBy.toString(),
			blobName: document.blobName,
			fileSize: document.fileSize,
			thumbnailBlobName: document.thumbnailBlobName,
			thumbnailDownloadUrl: document.thumbnailDownloadUrl
				? document.thumbnailDownloadUrl
				: null,
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
