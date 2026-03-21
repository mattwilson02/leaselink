import {
	Controller,
	ForbiddenException,
	Get,
	HttpStatus,
	NotFoundException,
	Param,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import type { HttpUserResponse } from '../../presenters/http-user-presenter'
import { GetSignatureByDocumentIdUseCase } from '@/domain/signature/application/use-cases/get-signature-by-document-id'
import { SignatureNotFoundError } from '@/domain/signature/application/use-cases/errors/signature-not-found-error'
import { HttpSignaturePresenter } from '../../presenters/http-signature-presenter'
import { GetDocumentByIdUseCase } from '@/domain/document/application/use-cases/get-document-by-id'
import { StorageRepository } from '@/domain/document/application/repositories/storage-repository'

@ApiTags('Documents')
@Controller('/documents')
export class GetSignatureController {
	constructor(
		private readonly getSignatureByDocumentIdUseCase: GetSignatureByDocumentIdUseCase,
		private readonly getDocumentByIdUseCase: GetDocumentByIdUseCase,
		private readonly storageRepository: StorageRepository,
	) {}

	private errorMap = {
		[SignatureNotFoundError.name]: NotFoundException,
	}

	@Get(':id/signature')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get the signature for a document' })
	@ApiParam({ name: 'id', description: 'Document ID' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Signature found',
		schema: {
			type: 'object',
			properties: { signature: { type: 'object' } },
		},
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Signature not found',
	})
	async getSignature(
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

		const result = await this.getSignatureByDocumentIdUseCase.execute({
			documentId,
		})

		if (result.isLeft()) {
			const error = result.value
			const exception =
				this.errorMap[error.constructor.name] || NotFoundException
			throw new exception(error.message)
		}

		return {
			signature: HttpSignaturePresenter.toHTTP(result.value.signature),
		}
	}

	@Get(':id/signature/image')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Generate a download URL for the signature image' })
	@ApiParam({ name: 'id', description: 'Document ID' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Download URL generated',
		schema: {
			type: 'object',
			properties: { downloadUrl: { type: 'string' } },
		},
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Signature not found',
	})
	async getSignatureImage(
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

		const sigResult = await this.getSignatureByDocumentIdUseCase.execute({
			documentId,
		})

		if (sigResult.isLeft()) {
			throw new NotFoundException('No signature found for this document')
		}

		const { signatureImageKey } = sigResult.value.signature

		const urlResult = await this.storageRepository.generateDownloadUrl({
			blobName: signatureImageKey,
		})

		if (urlResult.isLeft()) {
			throw new NotFoundException('Signature image not found in storage')
		}

		return { downloadUrl: urlResult.value.downloadUrl }
	}
}
