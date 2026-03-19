import { DocumentRequest } from '@/domain/document/enterprise/entities/document-request'
import { DocumentRequestDTO } from '../DTOs/document-request/document-request-dto'

export class HttpDocumentRequestsPresenter {
	static toHTTP(documentRequests: DocumentRequest[]): DocumentRequestDTO[] {
		return documentRequests.map((documentRequest) => ({
			id: documentRequest.id.toString(),
			clientId: documentRequest.clientId.toString(),
			requestedBy: documentRequest.requestedBy.toString(),
			requestType: documentRequest.requestType.value,
			status: documentRequest.status.value,
			documentId: documentRequest.documentId?.toString() ?? null,
			createdAt: documentRequest.createdAt
				? documentRequest.createdAt instanceof Date
					? documentRequest.createdAt.toISOString()
					: documentRequest.createdAt
				: '',
			updatedAt: documentRequest.updatedAt
				? documentRequest.updatedAt instanceof Date
					? documentRequest.updatedAt.toISOString()
					: documentRequest.updatedAt
				: null,
		}))
	}
}
