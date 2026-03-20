import {
	Controller,
	ForbiddenException,
	Get,
	HttpStatus,
	NotFoundException,
	Param,
	Res,
} from '@nestjs/common'
import type { Response } from 'express'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import type { HttpUserResponse } from '../../presenters/http-user-presenter'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiParam,
} from '@nestjs/swagger'
import { GetDocumentByIdUseCase } from '@/domain/document/application/use-cases/get-document-by-id'
import { DocumentNotFoundError } from '@/domain/document/application/use-cases/errors/document-not-found-error'
import { GetDocumentWithDownloadUrlResponseDTO } from '../../DTOs/document/get-document-with-download-url-response-dto'
import { HttpDocumentSingleWithUrlPresenter } from '../../presenters/http-document-single-presenter-with-download-url'

@ApiTags('Documents')
@Controller('/documents')
export class GetDocumentByIdController {
	constructor(
		private readonly getDocumentByIdUseCase: GetDocumentByIdUseCase,
	) {}

	private errorMap = {
		[DocumentNotFoundError.name]: NotFoundException,
	}

	@Get(':documentId')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Retrieve a document by its ID' })
	@ApiParam({
		name: 'documentId',
		description: 'Unique identifier of the document',
		example: 'a37bf2c9-9f1f-4eea-924b-4d6617cd5aff',
		required: true,
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Document found',
		type: GetDocumentWithDownloadUrlResponseDTO,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Document not found.',
		schema: {
			type: 'object',
			properties: {
				statusCode: { type: 'number', example: 404 },
				message: {
					type: 'string',
					example: 'Document with ID: ${documentId} not found.',
				},
				error: { type: 'string', example: 'Not Found' },
			},
		},
	})
	async findById(
		@CurrentUser() user: HttpUserResponse,
		@Param('documentId') documentId: string,
		@Res() res: Response,
	) {
		const result = await this.getDocumentByIdUseCase.execute({
			documentId,
		})

		if (result.isLeft()) {
			const error = result.value
			const exception =
				this.errorMap[error.constructor.name] || NotFoundException

			throw new exception(error.message)
		}

		const { document } = result.value

		// Ownership check: clients can only view their own documents
		if (user.type === 'CLIENT' && document.clientId.toString() !== user.id) {
			throw new ForbiddenException('You do not have access to this document')
		}

		return res.status(HttpStatus.OK).json({
			document: HttpDocumentSingleWithUrlPresenter.toHTTP(document),
		})
	}
}
