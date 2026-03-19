import { Controller, Get, Query, HttpStatus, Res } from '@nestjs/common'
import { Response } from 'express'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiQuery,
	ApiBearerAuth,
} from '@nestjs/swagger'
import { GetRecentlyViewedDocumentsUseCase } from '@/domain/document/application/use-cases/get-recently-viewed-documents'
import { ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { HttpDocumentsPresenter } from '../../presenters/http-documents-presenter'
import { GetDocumentsByClientIdResponseDTO } from '../../DTOs/document/get-documents-by-client-id-dto'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'

const getRecentlyViewedDocumentsQuerySchema = z.object({
	limit: z.string().optional(),
	folderName: z
		.enum([
			'IDENTIFICATION',
			'LEASE_AGREEMENTS',
			'SIGNED_DOCUMENTS',
			'INSPECTION_REPORTS',
			'INSURANCE',
			'OTHER',
		])
		.optional(),
})

type GetRecentlyViewedDocumentsQuerySchema = z.infer<
	typeof getRecentlyViewedDocumentsQuerySchema
>

const queryValidationPipe = new ZodValidationPipe(
	getRecentlyViewedDocumentsQuerySchema,
)

@ApiTags('Documents')
@Controller('/recently-viewed-documents')
export class GetRecentlyViewedDocumentsController {
	constructor(
		private readonly getRecentlyViewedDocumentsUseCase: GetRecentlyViewedDocumentsUseCase,
	) {}

	@Get()
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get recently viewed documents for current user' })
	@ApiQuery({
		name: 'limit',
		required: false,
		example: 10,
		description: 'Maximum number of documents to return (default: 10)',
	})
	@ApiQuery({
		name: 'folderName',
		required: false,
		example: 'IDENTIFICATION',
		description:
			'Filter documents by folder name. Possible values: IDENTIFICATION, LEASE_AGREEMENTS, SIGNED_DOCUMENTS, INSPECTION_REPORTS, INSURANCE, OTHER',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'List of recently viewed documents',
		type: GetDocumentsByClientIdResponseDTO,
	})
	@ApiResponse({
		status: HttpStatus.NO_CONTENT,
		description: 'No recently viewed documents found',
	})
	async getRecentlyViewed(
		@CurrentUser() user: HttpUserResponse,
		@Query(queryValidationPipe) query: GetRecentlyViewedDocumentsQuerySchema,
		@Res() res: Response,
	) {
		const limit = Number(query.limit) || 10
		const clientId = user.id

		if (!user || !clientId) {
			return res.status(HttpStatus.UNAUTHORIZED).send()
		}

		const result = await this.getRecentlyViewedDocumentsUseCase.execute({
			clientId,
			limit,
			folderName: query.folderName,
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
