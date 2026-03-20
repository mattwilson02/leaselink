import {
	Controller,
	Get,
	Query,
	NotFoundException,
	HttpStatus,
} from '@nestjs/common'
import {
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiQuery,
	ApiBearerAuth,
} from '@nestjs/swagger'
import { GetDocumentRequestsByClientIdUseCase } from '@/domain/document/application/use-cases/get-document-requests-by-client-id'
import { DocumentRequestRepository } from '@/domain/document/application/repositories/document-request-repository'
import { ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { DocumentRequestType } from '@leaselink/shared'
import { DocumentRequestsDto } from '../../DTOs/document-request/document-requests-dto'
import { HttpDocumentRequestsPresenter } from '../../presenters/http-document-requests-presenter'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { DocumentRequestsByClientIdNotFoundError } from '@/domain/document/application/use-cases/errors/document-requests-by-client-id-not-found-error'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'

const getDocumentRequestQuerySchema = z.object({
	limit: z.string().optional(),
	offset: z.string().optional(),
	requestType: z.nativeEnum(DocumentRequestType).optional(),
})

type GetDocumentRequestsQuerySchema = z.infer<
	typeof getDocumentRequestQuerySchema
>
const queryValidationPipe = new ZodValidationPipe(getDocumentRequestQuerySchema)

@ApiTags('Document Requests')
@Controller('document-requests')
export class GetDocumentRequestsByClientIdController {
	constructor(
		private readonly getDocumentRequestsByClientIdUseCase: GetDocumentRequestsByClientIdUseCase,
		private readonly documentRequestRepository: DocumentRequestRepository,
	) {}

	private errorMap = {
		[DocumentRequestsByClientIdNotFoundError.name]: NotFoundException,
		[ClientNotFoundError.name]: NotFoundException,
	}

	@Get()
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Get document requests for current user',
	})
	@ApiQuery({
		name: 'requestType',
		required: false,
		enum: DocumentRequestType,
		description: 'Type of the document request',
		example: 'PROOF_OF_IDENTITY',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Document request found for client id',
		type: DocumentRequestsDto,
	})
	@ApiResponse({
		status: HttpStatus.NO_CONTENT,
		description: 'No Document request content found for clientId',
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Client not found',
	})
	async findAll(
		@CurrentUser() user: HttpUserResponse,
		@Query(queryValidationPipe) query: GetDocumentRequestsQuerySchema,
	): Promise<DocumentRequestsDto> {
		const offset = Number(query.offset) || 0
		const limit = Number(query.limit) || 10
		const { requestType } = query

		if (!user) {
			throw new NotFoundException('User not found')
		}

		// Employees (managers) see all document requests
		if (user.type === 'EMPLOYEE') {
			const documentRequests =
				await this.documentRequestRepository.getMany(limit, offset, requestType)

			return {
				documentRequests: HttpDocumentRequestsPresenter.toHTTP(
					documentRequests ?? [],
				),
			}
		}

		// Clients (tenants) see only their own
		const result = await this.getDocumentRequestsByClientIdUseCase.execute({
			clientId: user.id,
			offset,
			limit,
			requestType,
		})

		if (result.isLeft()) {
			const error = result.value
			const exception =
				this.errorMap[error.constructor.name] || NotFoundException

			throw new exception(error.message)
		}

		return {
			documentRequests: HttpDocumentRequestsPresenter.toHTTP(
				result.value.documentRequestsByClientId,
			),
		}
	}
}
