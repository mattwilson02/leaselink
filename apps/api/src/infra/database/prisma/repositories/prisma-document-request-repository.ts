import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { DocumentRequestRepository } from '@/domain/document/application/repositories/document-request-repository'
import { PrismaDocumentRequestMapper } from '../mappers/prisma-document-request-mapper'
import { DocumentRequest } from '@/domain/document/enterprise/entities/document-request'
import { Either, left, right } from '@/core/either'
import { DocumentRequestNotFoundError } from '@/domain/document/application/use-cases/errors/document-request-not-found-error'

@Injectable()
export class PrismaDocumentRequestRepository
	implements DocumentRequestRepository
{
	constructor(private prisma: PrismaService) {}

	async getManyByClientId(
		clientId: string,
		limit: number,
		offset: number,
		requestType?: string, // <-- add this parameter
	): Promise<DocumentRequest[] | null> {
		// biome-ignore lint/suspicious/noExplicitAny: <Explicitly allowing any type>
		const where: any = { clientId }
		if (requestType) {
			where.requestType = requestType
		}

		const documentRequests = await this.prisma.documentRequest.findMany({
			where,
			take: limit,
			skip: offset,
		})

		if (!documentRequests) {
			return null
		}

		return documentRequests.map((documentRequest) =>
			PrismaDocumentRequestMapper.toDomain(documentRequest),
		)
	}

	async getMany(
		limit: number,
		offset: number,
		requestType?: string,
	): Promise<DocumentRequest[] | null> {
		// biome-ignore lint/suspicious/noExplicitAny: <Explicitly allowing any type>
		const where: any = {}
		if (requestType) {
			where.requestType = requestType
		}

		const documentRequests = await this.prisma.documentRequest.findMany({
			where,
			take: limit,
			skip: offset,
			orderBy: { createdAt: 'desc' },
		})

		if (!documentRequests) {
			return null
		}

		return documentRequests.map((documentRequest) =>
			PrismaDocumentRequestMapper.toDomain(documentRequest),
		)
	}

	async getById(id: string): Promise<DocumentRequest | null> {
		const documentRequest = await this.prisma.documentRequest.findUnique({
			where: {
				id,
			},
		})

		if (!documentRequest) {
			return null
		}

		return PrismaDocumentRequestMapper.toDomain(documentRequest)
	}

	async create(
		documentRequest: DocumentRequest,
	): Promise<DocumentRequest | null> {
		const raw = PrismaDocumentRequestMapper.toPrisma(documentRequest)

		const documentResponseBody = await this.prisma.documentRequest.create({
			data: raw,
		})

		if (!documentResponseBody) {
			return null
		}

		return PrismaDocumentRequestMapper.toDomain(documentResponseBody)
	}

	async update(
		documentRequest: DocumentRequest,
	): Promise<Either<Error, DocumentRequest>> {
		const raw = PrismaDocumentRequestMapper.toPrisma(documentRequest)

		const documentResponseBody = await this.prisma.documentRequest.update({
			where: {
				id: documentRequest.id.toString(),
			},
			data: raw,
		})

		if (!documentResponseBody) {
			return left(new DocumentRequestNotFoundError())
		}

		return right(PrismaDocumentRequestMapper.toDomain(documentResponseBody))
	}
}
