import { DownloadDocumentResponseDTO } from '../DTOs/document/download-document-response'

export class HttpDownloadUrlPresenter {
	static toHTTP(downloadDocument: DownloadDocumentResponseDTO) {
		return {
			downloadUrl: downloadDocument.downloadUrl,
			blobName: downloadDocument.blobName,
			expiresOn: downloadDocument.expiresOn,
		}
	}
}
