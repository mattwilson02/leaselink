import { FolderSummary } from '@/domain/document/application/use-cases/get-document-folder-summary'
import { GetFolderSummaryResponseDTO } from '../DTOs/document/get-folder-summary-response-dto'

export class HttpDocumentByFolderPresenter {
	static toHTTP(
		documentsByFolder: FolderSummary[],
	): GetFolderSummaryResponseDTO {
		return {
			documentsByFolder,
		}
	}
}
