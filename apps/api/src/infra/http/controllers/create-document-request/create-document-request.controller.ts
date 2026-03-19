import { CreateDocumentRequestUseCase } from '@/domain/document/application/use-cases/create-document-request'
import { CreateDocumentRequestDTO } from '../../DTOs/document-request/create-document-request-dto'
import { DocumentRequestResponseDTO } from '../../DTOs/document-request/create-document-request-response-dto'
import { HttpDocumentRequestSinglePresenter } from '../../presenters/http-document-request-single-presenter'
import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from 'nestjs-zod'
import { OnlyEmployeesCanCreateClientDTO } from '../../DTOs/employee/only-employees-can-create-client-dto'
import { CreateDocumentRequestBadRequestDTO } from '../../DTOs/document-request/create-document-request-bad-request-dto'
import { CreateDocumentRequestError } from '@/domain/document/application/use-cases/errors/create-document-request-error'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'

const createDocumentRequestBodySchema = z.object({
	clientId: z.string(),
	requestedBy: z.string(),
	requestType: z.string(),
})

type CreateDocumentRequestBodySchema = z.infer<
	typeof createDocumentRequestBodySchema
>
const bodyValidationPipe = new ZodValidationPipe(
	createDocumentRequestBodySchema,
)

@ApiTags('Document Requests')
@Controller('/document-requests')
export class CreateDocumentRequestController {
	constructor(private createDocumentRequest: CreateDocumentRequestUseCase) {}

	private errorMap = {
		[CreateDocumentRequestError.name]: BadRequestException,
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Create a document request',
		description: 'Creates a new document request for a client.',
	})
	@ApiBody({
		type: CreateDocumentRequestDTO,
	})
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: 'Document request successfully created',
		type: DocumentRequestResponseDTO,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Invalid request body',
		type: CreateDocumentRequestBadRequestDTO,
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Only employees can create document requests',
		type: OnlyEmployeesCanCreateClientDTO,
	})
	async handle(
		@Body(bodyValidationPipe) body: CreateDocumentRequestBodySchema,
	) {
		const { clientId, requestedBy, requestType } = body

		const response = await this.createDocumentRequest.execute({
			clientId,
			requestedBy,
			requestType,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || BadRequestException

			throw new exception(error.message)
		}

		return HttpDocumentRequestSinglePresenter.toHTTP(
			response.value.documentRequest,
		)
	}
}
