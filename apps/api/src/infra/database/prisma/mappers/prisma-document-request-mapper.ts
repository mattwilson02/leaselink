import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DocumentRequest } from '@/domain/document/enterprise/entities/document-request'
import { DocumentRequestStatus } from '@/domain/document/enterprise/entities/value-objects/document-request-status'
import { DocumentRequestType } from '@/domain/document/enterprise/entities/value-objects/document-request-type'
import {
	type Prisma,
	type DocumentRequest as PrismaDocumentRequest,
} from '@prisma/client'

export class PrismaDocumentRequestMapper {
	static toDomain(raw: PrismaDocumentRequest): DocumentRequest {
		return DocumentRequest.create(
			{
				clientId: new UniqueEntityId(raw.clientId),
				requestedBy: new UniqueEntityId(raw.requestedBy),
				status: DocumentRequestStatus.create(raw.status),
				requestType: DocumentRequestType.create(raw.requestType),
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt,
				documentId: raw.documentId
					? new UniqueEntityId(raw.documentId)
					: undefined,
			},
			new UniqueEntityId(raw.id),
		)
	}

	static toPrisma(
		documentRequest: DocumentRequest,
	): Prisma.DocumentRequestUncheckedCreateInput {
		return {
			id: documentRequest.id.toString(),
			clientId: documentRequest.clientId.toString(),
			requestedBy: documentRequest.requestedBy.toString(),
			status: documentRequest.status.value,
			requestType: documentRequest.requestType.value,
			createdAt: documentRequest.createdAt,
			updatedAt: documentRequest.updatedAt,
			documentId: documentRequest.documentId?.toString(),
		}
	}
}
