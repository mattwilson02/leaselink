import { Either, left, right } from '@/core/either'
import type { DocumentRequestRepository } from '@/domain/document/application/repositories/document-request-repository'
import { DocumentRequestNotFoundError } from '@/domain/document/application/use-cases/errors/document-request-not-found-error'
import type { DocumentRequest } from '@/domain/document/enterprise/entities/document-request'
import { DocumentRequestType } from '@/domain/document/enterprise/entities/value-objects/document-request-type'

export class InMemoryDocumentRequestRepository
	implements DocumentRequestRepository
{
	getByClientId(
		id: string,
		type: DocumentRequestType,
	): Promise<DocumentRequest | null> {
		const request = this.items.find(
			(request) => request.id.toString() === id && request.requestType === type,
		)
		return Promise.resolve(request ?? null)
	}
	public items: DocumentRequest[] = []

	async getById(id: string): Promise<DocumentRequest | null> {
		const request = this.items.find((request) => request.id.toString() === id)
		return Promise.resolve(request ?? null)
	}

	async getMany(
		limit: number,
		offset: number,
		requestType?: string,
	): Promise<DocumentRequest[] | null> {
		let requests = this.items
		if (requestType) {
			requests = requests.filter((r) => String(r.requestType) === requestType)
		}
		return Promise.resolve(requests.slice(offset, offset + limit))
	}

	//TODO implement optional requesttype
	async getManyByClientId(
		clientId: string,
		limit: number,
		offset: number,
	): Promise<DocumentRequest[] | null> {
		const requests = this.items.filter(
			(request) => request.clientId.toString() === clientId,
		)
		return Promise.resolve(requests.slice(offset, offset + limit))
	}

	async create(
		documentRequest: DocumentRequest,
	): Promise<DocumentRequest | null> {
		this.items.push(documentRequest)
		return Promise.resolve(documentRequest)
	}

	async update(
		documentRequest: DocumentRequest,
	): Promise<Either<Error, DocumentRequest>> {
		const index = this.items.findIndex(
			(request) => request.id.toString() === documentRequest.id.toString(),
		)
		if (index === -1) {
			return left(new DocumentRequestNotFoundError())
		}
		this.items[index] = documentRequest
		return right(documentRequest)
	}
}
