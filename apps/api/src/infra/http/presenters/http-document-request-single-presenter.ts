import { DocumentRequest } from '@/domain/document/enterprise/entities/document-request'

export class HttpDocumentRequestSinglePresenter {
	static toHTTP(documentRequest: DocumentRequest) {
		return {
			id: documentRequest.id.toString(),
			clientId: documentRequest.clientId.toString(),
			requestedBy: documentRequest.requestedBy.toString(),
			requestType: documentRequest.requestType.value,
			status: documentRequest.status.value,
			documentId: documentRequest.documentId?.toString() ?? null,
			createdAt: documentRequest.createdAt.toISOString(),
			updatedAt: documentRequest.updatedAt
				? documentRequest.updatedAt instanceof Date
					? documentRequest.updatedAt.toISOString()
					: documentRequest.updatedAt
				: null,
		}
	}
}
