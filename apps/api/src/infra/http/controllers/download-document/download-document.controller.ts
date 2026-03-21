import {
	Controller,
	ForbiddenException,
	Post,
	Body,
	NotFoundException,
	HttpStatus,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { DocumentNotFoundError } from '@/domain/document/application/use-cases/errors/document-not-found-error'
import { BlobDoesNotExistError } from '@/domain/document/application/use-cases/errors/blob-does-not-exist-error'
import { HttpDownloadUrlPresenter } from '../../presenters/http-download-url-presenter'
import { DownloadDocumentRequestDTO } from '../../DTOs/document/download-document-request-dto'
import { DownloadDocumentBadRequestDTO } from '../../DTOs/document/download-document-bad-request-dto'
import { DownloadDocumentInternalServerErrorDTO } from '../../DTOs/document/download-document-internal-server-error-dto'
import { DownloadDocumentNotFoundDTO } from '../../DTOs/document/download-document-not-found-dto copy'
import { DownloadDocumentUseCase } from '@/domain/document/application/use-cases/download-document'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import type { HttpUserResponse } from '../../presenters/http-user-presenter'
import { GetDocumentByIdUseCase } from '@/domain/document/application/use-cases/get-document-by-id'

@ApiTags('Documents')
@Controller('/documents')
export class DownloadDocumentController {
	constructor(
		private readonly downloadDocumentUseCase: DownloadDocumentUseCase,
		private readonly getDocumentByIdUseCase: GetDocumentByIdUseCase,
	) {}
	private errorMap = {
		[DocumentNotFoundError.name]: NotFoundException,
		[BlobDoesNotExistError.name]: NotFoundException,
	}

	@Post('download')
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Generate a URL for file download from blob storage',
	})
	@ApiBody({
		type: DownloadDocumentRequestDTO,
		description: 'Blob name and other download parameters',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Successfully generated download URL',
		schema: {
			type: 'object',
			properties: { downloadUrl: { type: 'string' } },
			additionalProperties: false,
		},
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Document not found',
		type: DownloadDocumentNotFoundDTO,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Invalid request body',
		type: DownloadDocumentBadRequestDTO,
	})
	@ApiResponse({
		status: HttpStatus.INTERNAL_SERVER_ERROR,
		description: 'Internal server error',
		type: DownloadDocumentInternalServerErrorDTO,
	})
	async generateDownloadUrl(
		@CurrentUser() user: HttpUserResponse,
		@Body() body: DownloadDocumentRequestDTO,
	) {
		// Ownership check: clients can only download their own documents
		if (user.type === 'CLIENT') {
			const docResult = await this.getDocumentByIdUseCase.execute({
				documentId: body.documentId,
			})
			if (docResult.isRight()) {
				const doc = docResult.value.document
				if (doc.clientId.toString() !== user.id) {
					throw new ForbiddenException(
						'You do not have access to this document',
					)
				}
			}
		}

		const result = await this.downloadDocumentUseCase.execute({
			documentId: body.documentId,
		})

		if (result.isLeft()) {
			const error = result.value
			const exception =
				this.errorMap[error.constructor.name] || NotFoundException

			throw new exception(error.message)
		}

		const downloadUrl = result.value

		return HttpDownloadUrlPresenter.toHTTP(downloadUrl)
	}
}
