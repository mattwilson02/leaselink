import {
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	ForbiddenException,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
	Req,
} from '@nestjs/common'
import type { Request } from 'express'
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import type { HttpUserResponse } from '../../presenters/http-user-presenter'
import { SignDocumentUseCase } from '@/domain/signature/application/use-cases/sign-document'
import { DocumentNotFoundError } from '@/domain/document/application/use-cases/errors/document-not-found-error'
import { DocumentNotSignableError } from '@/domain/signature/application/use-cases/errors/document-not-signable-error'
import { DocumentAlreadySignedError } from '@/domain/signature/application/use-cases/errors/document-already-signed-error'
import { SignatureImageNotFoundError } from '@/domain/signature/application/use-cases/errors/signature-image-not-found-error'
import { HttpSignaturePresenter } from '../../presenters/http-signature-presenter'
import { StorageRepository } from '@/domain/document/application/repositories/storage-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { GetDocumentByIdUseCase } from '@/domain/document/application/use-cases/get-document-by-id'

const signDocumentBodySchema = z.object({
	signatureImageKey: z.string().min(1),
})

type SignDocumentBody = z.infer<typeof signDocumentBodySchema>

@ApiTags('Documents')
@Controller('/documents')
export class SignDocumentController {
	constructor(
		private readonly signDocumentUseCase: SignDocumentUseCase,
		private readonly storageRepository: StorageRepository,
		private readonly getDocumentByIdUseCase: GetDocumentByIdUseCase,
	) {}

	private errorMap = {
		[DocumentNotFoundError.name]: NotFoundException,
		[DocumentNotSignableError.name]: BadRequestException,
		[DocumentAlreadySignedError.name]: ConflictException,
		[SignatureImageNotFoundError.name]: NotFoundException,
	}

	@Post(':id/sign/upload')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Generate an upload URL for a signature image' })
	@ApiParam({ name: 'id', description: 'Document ID' })
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: 'Upload URL generated',
		schema: {
			type: 'object',
			properties: {
				uploadUrl: { type: 'string' },
				blobName: { type: 'string' },
			},
		},
	})
	async generateSignatureUploadUrl(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') documentId: string,
	) {
		const docResult = await this.getDocumentByIdUseCase.execute({ documentId })

		if (docResult.isLeft()) {
			throw new NotFoundException(docResult.value.message)
		}

		const doc = docResult.value.document
		if (user.type === 'CLIENT' && doc.clientId.toString() !== user.id) {
			throw new ForbiddenException('You do not have access to this document')
		}

		const blobName = `signatures/${documentId}/${new UniqueEntityId().toString()}.png`
		const result = await this.storageRepository.generateUploadUrl(
			blobName,
			'image/png',
		)

		if (result.isLeft()) {
			throw new NotFoundException('Failed to generate upload URL')
		}

		return {
			uploadUrl: result.value,
			blobName,
		}
	}

	@Post(':id/sign')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Sign a document' })
	@ApiParam({ name: 'id', description: 'Document ID' })
	@ApiBody({
		schema: {
			type: 'object',
			properties: { signatureImageKey: { type: 'string' } },
		},
	})
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: 'Document signed',
		schema: {
			type: 'object',
			properties: { signature: { type: 'object' } },
		},
	})
	async sign(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') documentId: string,
		@Body(new ZodValidationPipe(signDocumentBodySchema)) body: SignDocumentBody,
		@Req() req: Request,
	) {
		const docResult = await this.getDocumentByIdUseCase.execute({ documentId })

		if (docResult.isLeft()) {
			throw new NotFoundException(docResult.value.message)
		}

		const ipAddress =
			(req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
			req.ip ??
			null
		const userAgent = (req.headers['user-agent'] as string) ?? null

		const result = await this.signDocumentUseCase.execute({
			documentId,
			signedBy: user.id,
			signatureImageKey: body.signatureImageKey,
			ipAddress: ipAddress ?? undefined,
			userAgent: userAgent ?? undefined,
		})

		if (result.isLeft()) {
			const error = result.value
			const exception =
				this.errorMap[error.constructor.name] || BadRequestException
			throw new exception(error.message)
		}

		return {
			signature: HttpSignaturePresenter.toHTTP(result.value.signature),
		}
	}
}
