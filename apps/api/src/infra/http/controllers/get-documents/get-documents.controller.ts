import {
	Controller,
	Get,
	Query,
	HttpStatus,
	Res,
	NotFoundException,
} from '@nestjs/common'
import { Response } from 'express'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiQuery,
	ApiBearerAuth,
} from '@nestjs/swagger'
import { GetManyDocumentsByClientIdUseCase } from '@/domain/document/application/use-cases/get-many-documents-by-client-id.ts'
import { ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { HttpDocumentsPresenter } from '../../presenters/http-documents-presenter'
import { GetDocumentsByClientIdResponseDTO } from '../../DTOs/document/get-documents-by-client-id-dto'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { DocumentFolder } from '@/domain/document/enterprise/entities/value-objects/document-folders'

const getDocumentsQuerySchema = z.object({
	offset: z.string().optional(),
	limit: z.string().optional(),
	search: z.string().optional(),
	createdAtFrom: z.string().datetime().optional(),
	createdAtTo: z.string().datetime().optional(),
	folders: z
		.union([
			z.enum([
				'IDENTIFICATION',
				'LEASE_AGREEMENTS',
				'SIGNED_DOCUMENTS',
				'INSPECTION_REPORTS',
				'INSURANCE',
				'OTHER',
			]),
			z.array(
				z.enum([
					'IDENTIFICATION',
					'LEASE_AGREEMENTS',
					'SIGNED_DOCUMENTS',
					'INSPECTION_REPORTS',
					'INSURANCE',
					'OTHER',
				]),
			),
		])
		.optional()
		.transform((val) => {
			if (!val) return undefined
			return Array.isArray(val) ? val : [val]
		}),
})

type GetDocumentsQuerySchema = z.infer<typeof getDocumentsQuerySchema>

const queryValidationPipe = new ZodValidationPipe(getDocumentsQuerySchema)

@ApiTags('Documents')
@Controller('/documents')
export class GetDocumentsByClientIdController {
	constructor(
		private readonly getDocumentsUseCase: GetManyDocumentsByClientIdUseCase,
	) {}

	private errorMap = {
		[ClientNotFoundError.name]: NotFoundException,
	}

	@Get()
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get all documents for current user' })
	@ApiQuery({
		name: 'offset',
		required: false,
		example: 0,
		description: 'Pagination offset',
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		example: 10,
		description: 'Pagination limit',
	})
	@ApiQuery({
		name: 'search',
		required: false,
		example: 'invoice',
		description: 'Search term to filter documents by name',
	})
	@ApiQuery({
		name: 'createdAtTo',
		required: false,
		example: '2024-12-31T23:59:59.999Z',
		description: 'Filter documents created before this date (ISO string)',
	})
	@ApiQuery({
		name: 'createdAtFrom',
		required: false,
		example: '2024-01-01T00:00:00.000Z',
		description: 'Filter documents created after this date (ISO string)',
	})
	@ApiQuery({
		name: 'folders',
		required: false,
		example: ['IDENTIFICATION', 'INSURANCE'],
		description: 'Filter documents by folder types',
		type: [String],
		isArray: true,
		enum: DocumentFolder.values(),
	})

	@ApiResponse({
		status: HttpStatus.OK,
		description: 'List of documents by clientId',
		type: GetDocumentsByClientIdResponseDTO,
	})
	@ApiResponse({
		status: HttpStatus.NO_CONTENT,
		description: 'No documents found for the given clientId',
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Client not found',
	})
	async findAll(
		@CurrentUser() user: HttpUserResponse,
		@Query(queryValidationPipe) query: GetDocumentsQuerySchema,
		@Res()
		res: Response,
	) {
		const offset = Number(query.offset) || 0
		const limit = Number(query.limit) || 10
		const { search, createdAtFrom, createdAtTo, folders } = query

		const clientId = user.id

		if (!user || !clientId) {
			throw this.errorMap[ClientNotFoundError.name]
		}

		const result = await this.getDocumentsUseCase.execute({
			clientId,
			offset,
			limit,
			search,
			createdAtFrom: createdAtFrom ? new Date(createdAtFrom) : undefined,
			createdAtTo: createdAtTo ? new Date(createdAtTo) : undefined,
			folders,
		})

		if (
			!result.value ||
			!result.value.documents ||
			result.value.documents.length === 0
		) {
			return res.status(HttpStatus.NO_CONTENT).send()
		}

		return res.status(HttpStatus.OK).json({
			documents: HttpDocumentsPresenter.toHTTP(result.value.documents),
		})
	}
}
