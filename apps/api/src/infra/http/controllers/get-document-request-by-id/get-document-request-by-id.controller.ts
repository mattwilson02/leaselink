import {
	Controller,
	Get,
	Param,
	NotFoundException,
	HttpStatus,
} from '@nestjs/common'
import {
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiParam,
	ApiBearerAuth,
} from '@nestjs/swagger'
import { GetDocumentRequestByIdUseCase } from '@/domain/document/application/use-cases/get-document-request-by-id'
import { DocumentRequestDTO } from '../../DTOs/document-request/document-request-dto'
import { HttpDocumentRequestSinglePresenter } from '../../presenters/http-document-request-single-presenter'
import { DocumentRequestByIdNotFoundError } from '@/domain/document/application/use-cases/errors/document-request-by-id-not-found-error'
import { GetDocumentRequestByIdNotFoundDTO } from '../../DTOs/document-request/get-document-request-by-id-not-found-dto'

@ApiTags('Document Requests')
@Controller('document-requests')
export class GetDocumentRequestByIdController {
	constructor(
		private readonly getDocumentRequestByIdUseCase: GetDocumentRequestByIdUseCase,
	) {}

	private errorMap = {
		[DocumentRequestByIdNotFoundError.name]: NotFoundException,
	}

	@Get(':id')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get a document request by ID' })
	@ApiParam({
		name: 'id',
		description: 'Unique identifier of the document request',
		example: 'e2b0c442-98fc-1c14-9af2-d474c5ed654a',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Document request found',
		type: DocumentRequestDTO,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Document request not found',
		type: GetDocumentRequestByIdNotFoundDTO,
	})
	async handle(@Param('id') id: string): Promise<DocumentRequestDTO> {
		const result = await this.getDocumentRequestByIdUseCase.execute({ id })

		if (result.isLeft()) {
			const error = result.value
			const exception =
				this.errorMap[error.constructor.name] || NotFoundException

			throw new exception(error.message)
		}

		const { documentRequest } = result.value

		return HttpDocumentRequestSinglePresenter.toHTTP(documentRequest)
	}
}
