import { DocumentRepository } from '@/domain/document/application/repositories/document-repository'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import {
	Controller,
	Get,
	HttpStatus,
	HttpCode,
	UnauthorizedException,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { HttpDocumentByFolderPresenter } from '../../presenters/http-document-by-folder-presenter'
import { GetFolderSummaryResponseDTO } from '../../DTOs/document/get-folder-summary-response-dto'

@ApiTags('Documents')
@Controller('/documents/folder-summary')
export class GetFolderSummaryController {
	constructor(private readonly documentRepository: DocumentRepository) {}

	@Get()
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Get document count by folder for current user',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Document count by folder found for client',
		type: GetFolderSummaryResponseDTO,
	})
	async findAll(
		@CurrentUser() user: HttpUserResponse,
	): Promise<GetFolderSummaryResponseDTO> {
		if (!user?.id) {
			throw new UnauthorizedException()
		}

		// Managers see all documents across all clients
		if (user.type === 'EMPLOYEE') {
			const documentsByFolder =
				await this.documentRepository.getAllGroupedByDocumentType()

			return HttpDocumentByFolderPresenter.toHTTP(documentsByFolder ?? [])
		}

		// Tenants see only their own documents
		const documentsByFolder =
			await this.documentRepository.getManyByClientIdGroupedByDocumentType(
				user.id,
			)

		return HttpDocumentByFolderPresenter.toHTTP(documentsByFolder ?? [])
	}
}
