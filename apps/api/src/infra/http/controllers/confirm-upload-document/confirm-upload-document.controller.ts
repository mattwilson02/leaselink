import {
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
import { DocumentRequestNotFoundError } from '@/domain/document/application/use-cases/errors/document-request-not-found-error'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ConfirmUploadDocumentUseCase } from '@/domain/document/application/use-cases/confirm-upload-document'
import { DocumentFolder } from '@/domain/document/enterprise/entities/value-objects/document-folders'
import { HttpDocumentSinglePresenter } from '../../presenters/http-document-single-presenter'
import { BlobDoesNotExistError } from '@/domain/document/application/use-cases/errors/blob-does-not-exist-error'
import { ConfirmUploadDocumentRequestDTO } from '../../DTOs/document/confirm-upload-document-request-dto'
import { ConfirmUploadDocumentResponseDTO } from '../../DTOs/document/confirm-upload-document-response-dto'
import { ConfirmUploadDocumentBadRequestDTO } from '../../DTOs/document/confirm-upload-document-bad-request-dto'

const confirmUploadDocumentRequestBodySchema = z.object({
	blobName: z.string(),
	clientId: z.string(),
	contentKey: z.string().nullable().optional(),
	name: z.string(),
	fileSize: z.number(),
	thumbnailBlobName: z.string().nullable().optional(),
	folder: z.string(),
	uploadedBy: z.string(),
	documentRequestId: z.string(),
})

type ConfirmUploadDocumentRequestBodySchema = z.infer<
	typeof confirmUploadDocumentRequestBodySchema
>
const bodyValidationPipe = new ZodValidationPipe(
	confirmUploadDocumentRequestBodySchema,
)

@ApiTags('Documents')
@Controller('/documents/confirm-upload')
export class ConfirmUploadDocumentController {
	constructor(private confirmUploadDocument: ConfirmUploadDocumentUseCase) {}

	private errorMap = {
		[DocumentRequestNotFoundError.name]: BadRequestException,
		[BlobDoesNotExistError.name]: BadRequestException,
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Confirm uploading a document for a document request',
		description:
			'Confirms the upload of a document for an existing document request.',
	})
	@ApiBody({
		type: ConfirmUploadDocumentRequestDTO,
	})
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: 'Confirmed document upload successfully',
		type: ConfirmUploadDocumentResponseDTO,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Invalid request body',
		type: ConfirmUploadDocumentBadRequestDTO,
	})
	async handle(
		@Body(bodyValidationPipe) body: ConfirmUploadDocumentRequestBodySchema,
	) {
		const { documentRequestId } = body

		const response = await this.confirmUploadDocument.execute({
			blobName: body.blobName,
			clientId: new UniqueEntityId(body.clientId),
			contentKey: body.contentKey
				? new UniqueEntityId(body.contentKey)
				: undefined,
			name: body.name,
			fileSize: body.fileSize,
			thumbnailBlobName: body.thumbnailBlobName || null,
			folder: DocumentFolder.create(body.folder),
			uploadedBy: new UniqueEntityId(body.uploadedBy),
			documentRequestId: new UniqueEntityId(documentRequestId),
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || BadRequestException

			throw new exception(error.message)
		}

		return {
			document: HttpDocumentSinglePresenter.toHTTP(response.value.document),
		}
	}
}
