import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
	Document,
	DocumentProps,
} from '@/domain/document/enterprise/entities/document'
import { DocumentFolder } from '@/domain/document/enterprise/entities/value-objects/document-folders'
import { PrismaDocumentMapper } from '@/infra/database/prisma/mappers/prisma-document-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'

export const makeDocument = (
	override: Partial<DocumentProps> = {},
	id?: UniqueEntityId,
) => {
	const newDocument = Document.create(
		{
			clientId: new UniqueEntityId(faker.string.uuid()),
			contentKey: new UniqueEntityId(faker.string.uuid()),
			version: 1,
			name: faker.system.fileName(),
			blobName: `${Date.now()}-${faker.system.fileName()}`,
			fileSize: faker.number.int({ min: 1024, max: 10485760 }), // 1KB to 10MB
			thumbnailBlobName: null,
			folder: DocumentFolder.create(),
			uploadedBy: new UniqueEntityId(faker.string.uuid()),
			createdAt: faker.date.recent(),
			...override,
		},
		id,
	)

	return newDocument
}

@Injectable()
export class DocumentFactory {
	constructor(private prisma: PrismaService) {}

	async makePrismaDocument(
		data: Partial<DocumentProps> = {},
	): Promise<Document> {
		const document = makeDocument(data)

		const prismaCreatedDocument = await this.prisma.document.create({
			data: {
				id: document.id.toString(),
				clientId: document.clientId.toString(),
				contentKey: document.contentKey.toString(),
				version: document.version,
				name: document.name,
				blobName: document.blobName,
				fileSize: document.fileSize,
				thumbnailBlobName: document.thumbnailBlobName,
				folder: document.folder.value,
				uploadedBy: document.uploadedBy.toString(),
				createdAt: document.createdAt,
				updatedAt: document.updatedAt,
			},
		})

		return PrismaDocumentMapper.toDomain(prismaCreatedDocument)
	}
}
