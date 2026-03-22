import {
	BadGatewayException,
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
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
import { UploadDocumentUseCase } from '@/domain/document/application/use-cases/upload-document'
import { DocumentRequestNotFoundError } from '@/domain/document/application/use-cases/errors/document-request-not-found-error'
import { FileUploadFailedError } from '@/domain/document/application/use-cases/errors/file-upload-failed-error'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { UploadDocumentRequestDTO } from '../../DTOs/document/upload-document-request-dto'
import { UploadDocumentResponseDTO } from '../../DTOs/document/upload-document-response-dto'
import { UploadDocumentBadRequestDTO } from '../../DTOs/document/upload-document-bad-request-dto'

const uploadDocumentRequestBodySchema = z.object({
	documentRequestId: z.string(),
})

type UploadDocumentRequestBodySchema = z.infer<
	typeof uploadDocumentRequestBodySchema
>
const bodyValidationPipe = new ZodValidationPipe(
	uploadDocumentRequestBodySchema,
)

@ApiTags('Documents')
@Controller('/documents/upload')
export class UploadDocumentController {
	constructor(private uploadDocument: UploadDocumentUseCase) {}

	private errorMap = {
		[DocumentRequestNotFoundError.name]: BadRequestException,
		[FileUploadFailedError.name]: BadGatewayException,
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Upload a document for a document request',
		description: 'Uploads a document for an existing document request.',
	})
	@ApiBody({
		type: UploadDocumentRequestDTO,
	})
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: 'Upload URLs successfully generated',
		type: UploadDocumentResponseDTO,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Invalid request body',
		type: UploadDocumentBadRequestDTO,
	})
	@ApiResponse({
		status: HttpStatus.BAD_GATEWAY,
		description: 'Blob storage failure',
	})
	async handle(
		@Body(bodyValidationPipe) body: UploadDocumentRequestBodySchema,
	) {
		const { documentRequestId } = body

		const response = await this.uploadDocument.execute({
			documentRequestId: new UniqueEntityId(documentRequestId),
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || BadRequestException

			throw new exception(error.message)
		}

		return {
			uploadUrl: response.value.uploadUrl,
			thumbnailUploadUrl: response.value.thumbnailUploadUrl,
		}
	}
}
