import type {
	DocumentRepository,
	FolderSummary,
} from '@/domain/document/application/repositories/document-repository'
import { Document } from '@/domain/document/enterprise/entities/document'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaDocumentMapper } from '../mappers/prisma-document-mapper'
import { Either, left, right } from '@/core/either'
import { DocumentFolderType } from '@/domain/document/enterprise/entities/value-objects/document-folders'

@Injectable()
export class PrismaDocumentRepository implements DocumentRepository {
	constructor(private prisma: PrismaService) {}

	async getById(id: string): Promise<Document | null> {
		const document = await this.prisma.document.findUnique({
			where: {
				id,
			},
		})

		if (!document) {
			return null
		}

		return PrismaDocumentMapper.toDomain(document)
	}

	async create(document: Document): Promise<Either<Error, Document>> {
		const prismaDocument = PrismaDocumentMapper.toPrisma(document)
		const createdDocument = await this.prisma.document.create({
			data: prismaDocument,
		})

		if (!createdDocument) {
			return left(new Error('Failed to create document'))
		}

		return right(PrismaDocumentMapper.toDomain(createdDocument))
	}

	async getManyByClientId(
		clientId: string,
		offset: number,
		limit: number,
		search?: string,
		createdAtFrom?: Date,
		createdAtTo?: Date,
		folders?: DocumentFolderType[],
	): Promise<Document[]> {
		const latestVersions = await this.prisma.document.groupBy({
			by: ['contentKey'],
			where: {
				clientId,
			},
			// biome-ignore lint/style/useNamingConvention: <underlined, dev wants it like this>
			_max: {
				version: true,
			},
		})

		const documents = await this.prisma.document.findMany({
			where: {
				clientId,
				name: {
					contains: search ? search : undefined,
					mode: 'insensitive',
				},
				createdAt: {
					gte: createdAtFrom,
					lte: createdAtTo,
				},
				folder: folders
					? {
							in: folders,
						}
					: undefined,
				// biome-ignore lint/style/useNamingConvention: <intentional>
				OR: latestVersions
					.filter((item) => item._max?.version !== null)
					.map((item) => ({
						contentKey: item.contentKey,
						version: (item._max?.version ?? 0) as number,
					})),
			},
			orderBy: {
				createdAt: 'desc',
			},
			skip: offset,
			take: limit,
		})

		return documents.map(PrismaDocumentMapper.toDomain)
	}

	async getManyByContentKey(contentKey: string): Promise<Document[] | null> {
		const documents = await this.prisma.document.findMany({
			where: {
				contentKey,
			},
			orderBy: {
				version: 'desc',
			},
		})

		if (documents.length === 0) {
			return null
		}

		return documents.map(PrismaDocumentMapper.toDomain)
	}

	async getManyByClientIdGroupedByDocumentType(
		clientId: string,
	): Promise<FolderSummary[] | null> {
		const documentsByFolder = await this.prisma.document.groupBy({
			by: ['folder'],
			where: {
				clientId,
			},
			// biome-ignore lint/style/useNamingConvention: <Biome hates keywords I guess>
			_count: {
				folder: true,
			},
			// biome-ignore lint/style/useNamingConvention: <Maybe we need to look at our rules lol>
			_sum: {
				fileSize: true,
			},
			// biome-ignore lint/style/useNamingConvention: <Keywurdz bruv>
			_max: {
				updatedAt: true,
			},
		})

		if (documentsByFolder.length === 0) {
			return null
		}

		return documentsByFolder.map((group) => ({
			folderName: group.folder,
			fileCount: group._count.folder,
			totalFileSizeSum: group._sum.fileSize ?? 0,
			mostRecentUpdatedDate: group._max.updatedAt ?? null,
		}))
	}

	async getRecentlyViewedAt(
		clientId: string,
		limit = 10,
		folderName?: DocumentFolderType,
	): Promise<Document[] | null> {
		// First, get the latest version for each contentKey
		const latestVersions = await this.prisma.document.groupBy({
			by: ['contentKey'],
			where: {
				clientId,
				folder: folderName ? folderName : undefined,
				viewedAt: {
					not: null,
				},
			},
			// biome-ignore lint/style/useNamingConvention: <underlined, dev wants it like this>
			_max: {
				version: true,
			},
		})

		if (latestVersions.length === 0) {
			return null
		}

		// Get the actual documents with latest versions, sorted by viewedAt
		const documents = await this.prisma.document.findMany({
			where: {
				clientId,
				folder: folderName ? folderName : undefined,
				viewedAt: {
					not: null,
				},
				// biome-ignore lint/style/useNamingConvention: <intentional>
				OR: latestVersions
					.filter((item) => item._max?.version !== null)
					.map((item) => ({
						contentKey: item.contentKey,
						version: (item._max?.version ?? 0) as number,
					})),
			},
			orderBy: {
				viewedAt: 'desc',
			},
			take: limit,
		})

		if (documents.length === 0) {
			return null
		}

		return documents.map(PrismaDocumentMapper.toDomain)
	}

	async viewDocument(
		clientId: string,
		documentId: string,
	): Promise<Document | null> {
		const updatedDocument = await this.prisma.document.findFirst({
			where: {
				id: documentId,
				clientId,
			},
		})

		if (!updatedDocument) {
			return null
		}

		await this.prisma.document.update({
			where: {
				id: documentId,
			},
			data: {
				viewedAt: new Date(),
			},
		})

		return PrismaDocumentMapper.toDomain({
			...updatedDocument,
			viewedAt: new Date(),
		})
	}
}
