import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DocumentRequest } from '@/domain/document/enterprise/entities/document-request'
import { DocumentRequestStatus } from '@/domain/document/enterprise/entities/value-objects/document-request-status'
import { DocumentRequestType } from '@/domain/document/enterprise/entities/value-objects/document-request-type'
import { PrismaDocumentRequestMapper } from '@/infra/database/prisma/mappers/prisma-document-request-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'

export const makeDocumentRequest = (
	override: Partial<DocumentRequest> = {},
	id?: UniqueEntityId,
) => {
	const newDocumentRequest = DocumentRequest.create(
		{
			clientId: new UniqueEntityId(faker.string.uuid()),
			requestedBy: new UniqueEntityId(faker.string.uuid()),
			requestType: DocumentRequestType.create('PROOF_OF_IDENTITY'),
			status: DocumentRequestStatus.create('PENDING'),
			...override,
		},
		id,
	)

	return newDocumentRequest
}

@Injectable()
export class DocumentRequestFactory {
	constructor(private prisma: PrismaService) {}

	async makePrismaDocumentRequest(
		data: Partial<DocumentRequest> = {},
	): Promise<DocumentRequest> {
		const documentRequest = makeDocumentRequest(data)

		const prismaCreatedDocumentRequest =
			await this.prisma.documentRequest.create({
				data: {
					clientId: documentRequest.clientId.toString(),
					requestedBy: documentRequest.requestedBy.toString(),
					requestType: documentRequest.requestType.value,
					status: documentRequest.status.value,
				},
			})
		return PrismaDocumentRequestMapper.toDomain(prismaCreatedDocumentRequest)
	}
}
