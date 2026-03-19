import {
	Controller,
	Put,
	HttpStatus,
	NotFoundException,
	Param,
	Res,
	UnauthorizedException,
	UnprocessableEntityException,
	InternalServerErrorException,
} from '@nestjs/common'
import { Response } from 'express'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiParam,
} from '@nestjs/swagger'
import { ViewDocumentByIdUseCase } from '@/domain/document/application/use-cases/view-document-by-id'
import { DocumentNotFoundError } from '@/domain/document/application/use-cases/errors/document-not-found-error'
import { DocumentNotClientsError } from '@/domain/document/application/use-cases/errors/document-not-client-error'
import { GetDocumentWithDownloadUrlResponseDTO } from '../../DTOs/document/get-document-with-download-url-response-dto'
import { HttpDocumentSingleWithUrlPresenter } from '../../presenters/http-document-single-presenter-with-download-url'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { DocumentFailedToViewError } from '@/domain/document/application/use-cases/errors/document-failed-to-view-error'

@ApiTags('Documents')
@Controller('/documents')
export class ViewDocumentByIdController {
	constructor(
		private readonly viewDocumentByIdUseCase: ViewDocumentByIdUseCase,
	) {}

	private errorMap = {
		[DocumentNotFoundError.name]: NotFoundException,
		[DocumentNotClientsError.name]: UnprocessableEntityException,
		[DocumentFailedToViewError.name]: InternalServerErrorException,
	}

	@Put(':documentId/view')
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Mark a document as viewed and update viewedAt timestamp',
	})
	@ApiParam({
		name: 'documentId',
		description: 'Unique identifier of the document',
		example: 'a37bf2c9-9f1f-4eea-924b-4d6617cd5aff',
		required: true,
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Document viewed successfully',
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
	@ApiResponse({
		status: HttpStatus.UNPROCESSABLE_ENTITY,
		description: 'Document does not belong to the current user.',
		schema: {
			type: 'object',
			properties: {
				statusCode: { type: 'number', example: 422 },
				message: {
					type: 'string',
					example: 'Document does not belong to client.',
				},
				error: { type: 'string', example: 'Unauthorized' },
			},
		},
	})
	@ApiResponse({
		status: HttpStatus.INTERNAL_SERVER_ERROR,
		description: 'Failed to mark document as viewed.',
	})
	async viewDocument(
		@CurrentUser() user: HttpUserResponse,
		@Param('documentId') documentId: string,
		@Res() res: Response,
	) {
		const clientId = user.id

		if (!clientId) {
			throw new UnauthorizedException('User not authenticated')
		}

		const result = await this.viewDocumentByIdUseCase.execute({
			documentId,
			clientId,
		})

		if (result.isLeft()) {
			const error = result.value
			const exception =
				this.errorMap[error.constructor.name] || NotFoundException

			throw new exception(error.message)
		}

		const { document } = result.value

		return res.status(HttpStatus.OK).json({
			document: HttpDocumentSingleWithUrlPresenter.toHTTP(document),
		})
	}
}
