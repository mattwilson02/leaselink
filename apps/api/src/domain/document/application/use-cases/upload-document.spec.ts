import { DocumentRequest } from './../../enterprise/entities/document-request'
import { InMemoryDocumentRequestRepository } from 'test/repositories/prisma/in-memory-document-request-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DocumentRequestStatus } from '../../enterprise/entities/value-objects/document-request-status'
import { DocumentRequestType } from '../../enterprise/entities/value-objects/document-request-type'
import { UploadDocumentUseCase } from './upload-document'
import { InMemoryBlobStorageRepository } from 'test/repositories/prisma/in-memory-blob-storage-repository'
import { DocumentRequestNotFoundError } from './errors/document-request-not-found-error'

let inMemoryDocumentRequestRepository: InMemoryDocumentRequestRepository
let inMemoryBlobStorageRepository: InMemoryBlobStorageRepository
let sut: UploadDocumentUseCase
let mockDocumentRequestId: UniqueEntityId

describe('Upload document', () => {
	beforeEach(() => {
		inMemoryBlobStorageRepository = new InMemoryBlobStorageRepository()
		inMemoryDocumentRequestRepository = new InMemoryDocumentRequestRepository()
		sut = new UploadDocumentUseCase(
			inMemoryDocumentRequestRepository,
			inMemoryBlobStorageRepository,
		)

		const mockDocumentRequest: DocumentRequest = DocumentRequest.create({
			clientId: new UniqueEntityId(),
			requestedBy: new UniqueEntityId(),
			status: DocumentRequestStatus.create(),
			requestType: DocumentRequestType.create('PROOF_OF_ADDRESS'),
		})

		mockDocumentRequestId = mockDocumentRequest.id
		inMemoryDocumentRequestRepository.create(mockDocumentRequest)
	})

	it('should get an upload url and thumbnail upload url for a valid document request', async () => {
		const result = await sut.execute({
			documentRequestId: mockDocumentRequestId,
		})

		expect(result.isRight()).toBeTruthy()
		expect(result.value).toEqual({
			uploadUrl: expect.stringContaining('https://example.com/upload/'),
			thumbnailUploadUrl: expect.stringContaining(
				'https://example.com/upload/',
			),
		})
	})

	it('should get an upload url for a valid document request without thumbnailFileId', async () => {
		const result = await sut.execute({
			documentRequestId: mockDocumentRequestId,
		})

		expect(result.isRight()).toBeTruthy()
		expect(result.value).toEqual({
			uploadUrl: expect.stringContaining('https://example.com/upload/'),
			thumbnailUploadUrl: expect.stringContaining(
				'https://example.com/upload/',
			),
		})
	})

	it('should return DocumentRequestNotFoundError if the document request does not exist', async () => {
		const result = await sut.execute({
			documentRequestId: new UniqueEntityId('non-existing-id'),
		})
		expect(result.isRight()).toBeFalsy()
		expect(result.value).toEqual(new DocumentRequestNotFoundError())
	})
})
