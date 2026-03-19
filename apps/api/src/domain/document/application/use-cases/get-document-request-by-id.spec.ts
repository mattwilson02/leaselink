import { InMemoryDocumentRequestRepository } from 'test/repositories/prisma/in-memory-document-request-repository'
import { GetDocumentRequestByIdUseCase } from './get-document-request-by-id'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DocumentRequest } from '../../enterprise/entities/document-request'
import { DocumentRequestByIdNotFoundError } from './errors/document-request-by-id-not-found-error'
import { DocumentRequestType } from '../../enterprise/entities/value-objects/document-request-type'
import { DocumentRequestStatus } from '../../enterprise/entities/value-objects/document-request-status'

describe('GetDocumentRequestByIdUseCase', () => {
	let documentRequestRepository: InMemoryDocumentRequestRepository
	let sut: GetDocumentRequestByIdUseCase

	beforeEach(() => {
		documentRequestRepository = new InMemoryDocumentRequestRepository()
		sut = new GetDocumentRequestByIdUseCase(documentRequestRepository)
	})

	it('should return the document request if it exists', async () => {
		const documentRequestId = new UniqueEntityId()
		const documentRequest = DocumentRequest.create(
			{
				clientId: new UniqueEntityId(),
				requestedBy: new UniqueEntityId(),
				requestType: DocumentRequestType.create('PROOF_OF_ADDRESS'),
				status: DocumentRequestStatus.create('PENDING'),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			documentRequestId,
		)
		await documentRequestRepository.create(documentRequest)

		const result = await sut.execute({ id: documentRequestId.toString() })

		expect(result.isRight()).toBe(true)
	})

	it('should return DocumentRequestNotFoundError if the document request does not exist', async () => {
		const nonExistentId = new UniqueEntityId().toString()

		const result = await sut.execute({ id: nonExistentId })

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(DocumentRequestByIdNotFoundError)
	})
})
