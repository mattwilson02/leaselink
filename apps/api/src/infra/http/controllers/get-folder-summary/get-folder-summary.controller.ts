import { GetDocumentFolderSummaryUseCase } from '@/domain/document/application/use-cases/get-document-folder-summary'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import {
	Controller,
	Get,
	HttpStatus,
	NotFoundException,
	HttpCode,
	HttpException,
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
	constructor(
		private readonly getDocumentCountByFolderUseCase: GetDocumentFolderSummaryUseCase,
	) {}

	private errorMap = {
		[ClientNotFoundError.name]: NotFoundException,
	}

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
	@ApiResponse({
		status: HttpStatus.NO_CONTENT,
		description: 'No content',
	})
	async findAll(
		@CurrentUser() user: HttpUserResponse,
	): Promise<GetFolderSummaryResponseDTO> {
		const clientId = user.id

		if (!user || !clientId) {
			throw new this.errorMap[ClientNotFoundError.name]()
		}

		const result = await this.getDocumentCountByFolderUseCase.execute({
			clientId,
		})

		if (result.isLeft()) {
			throw new HttpException('No Content', HttpStatus.NO_CONTENT)
		}

		const documentsByFolder = result.value

		return HttpDocumentByFolderPresenter.toHTTP(documentsByFolder)
	}
}
