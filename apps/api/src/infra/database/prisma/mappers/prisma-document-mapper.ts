import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Document } from '@/domain/document/enterprise/entities/document'
import { DocumentFolder } from '@/domain/document/enterprise/entities/value-objects/document-folders'
import type { Prisma, Document as PrismaDocument } from '@prisma/client'

export class PrismaDocumentMapper {
	static toDomain(raw: PrismaDocument): Document {
		return Document.create(
			{
				clientId: new UniqueEntityId(raw.clientId),
				name: raw.name,
				contentKey: new UniqueEntityId(raw.contentKey),
				version: raw.version,
				blobName: raw.blobName,
				thumbnailBlobName: raw.thumbnailBlobName,
				fileSize: raw.fileSize,
				folder: DocumentFolder.create(raw.folder),
				uploadedBy: new UniqueEntityId(raw.uploadedBy),
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt,
				viewedAt: raw.viewedAt || null,
			},
			new UniqueEntityId(raw.id),
		)
	}

	static toPrisma(document: Document): Prisma.DocumentUncheckedCreateInput {
		return {
			id: document.id.toString(),
			name: document.name,
			clientId: document.clientId.toString(),
			contentKey: document.contentKey.toString(),
			version: document.version,
			blobName: document.blobName,
			fileSize: document.fileSize,
			folder: document.folder.value,
			uploadedBy: document.uploadedBy.toString(),
			createdAt: document.createdAt,
			updatedAt: document.updatedAt ?? null,
			thumbnailBlobName: document.thumbnailBlobName,
			viewedAt: document.viewedAt ?? null,
		}
	}
}
