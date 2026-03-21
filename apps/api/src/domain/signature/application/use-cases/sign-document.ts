import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DocumentRepository } from '@/domain/document/application/repositories/document-repository'
import { StorageRepository } from '@/domain/document/application/repositories/storage-repository'
import { CreateAuditLogUseCase } from '@/domain/audit/application/use-cases/create-audit-log'
import { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import {
	NotificationType,
	ActionType,
} from '@/domain/notification/enterprise/entities/notification'
import { DocumentNotFoundError } from '@/domain/document/application/use-cases/errors/document-not-found-error'
import { Signature } from '../../enterprise/entities/signature'
import { SignatureRepository } from '../repositories/signature-repository'
import { DocumentNotSignableError } from './errors/document-not-signable-error'
import { DocumentAlreadySignedError } from './errors/document-already-signed-error'
import { SignatureImageNotFoundError } from './errors/signature-image-not-found-error'

const SIGNABLE_FOLDERS = ['LEASE_AGREEMENTS', 'SIGNED_DOCUMENTS'] as const

export interface SignDocumentUseCaseRequest {
	documentId: string
	signedBy: string
	signatureImageKey: string
	ipAddress?: string
	userAgent?: string
}

type SignDocumentUseCaseResponse = Either<
	| DocumentNotFoundError
	| DocumentNotSignableError
	| DocumentAlreadySignedError
	| SignatureImageNotFoundError
	| Error,
	{ signature: Signature }
>

@Injectable()
export class SignDocumentUseCase {
	constructor(
		private documentRepository: DocumentRepository,
		private signatureRepository: SignatureRepository,
		private storageRepository: StorageRepository,
		private createAuditLogUseCase: CreateAuditLogUseCase,
		private createNotificationUseCase: CreateNotificationUseCase,
	) {}

	async execute(
		request: SignDocumentUseCaseRequest,
	): Promise<SignDocumentUseCaseResponse> {
		const document = await this.documentRepository.getById(request.documentId)

		if (!document) {
			return left(new DocumentNotFoundError(request.documentId))
		}

		const folder = document.folder.value
		if (
			!SIGNABLE_FOLDERS.includes(folder as (typeof SIGNABLE_FOLDERS)[number])
		) {
			return left(new DocumentNotSignableError(folder))
		}

		const existing = await this.signatureRepository.getByDocumentId(
			request.documentId,
		)
		if (existing) {
			return left(new DocumentAlreadySignedError(request.documentId))
		}

		const blobExists = await this.storageRepository.blobExists(
			request.signatureImageKey,
		)
		if (!blobExists) {
			return left(new SignatureImageNotFoundError(request.signatureImageKey))
		}

		const signature = Signature.create({
			documentId: new UniqueEntityId(request.documentId),
			signedBy: new UniqueEntityId(request.signedBy),
			signatureImageKey: request.signatureImageKey,
			ipAddress: request.ipAddress ?? null,
			userAgent: request.userAgent ?? null,
		})

		const result = await this.signatureRepository.create(signature)
		if (result.isLeft()) {
			return left(result.value)
		}

		await this.createAuditLogUseCase.execute({
			actorId: request.signedBy,
			actorType: 'CLIENT',
			action: 'SIGN',
			resourceType: 'DOCUMENT',
			resourceId: request.documentId,
			metadata: {
				signedBy: request.signedBy,
				ipAddress: request.ipAddress ?? null,
			},
		})

		await this.createNotificationUseCase.execute({
			personId: document.uploadedBy.toString(),
			text: 'A document has been signed.',
			notificationType: NotificationType.ACTION,
			actionType: ActionType.SIGN_DOCUMENT,
			linkedDocumentId: request.documentId,
		})

		return right({ signature: result.value })
	}
}
