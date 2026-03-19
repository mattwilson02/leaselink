import { DocumentRequest } from '../../enterprise/entities/document-request'
import { InMemoryDocumentRequestRepository } from 'test/repositories/prisma/in-memory-document-request-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DocumentRequestStatus } from '../../enterprise/entities/value-objects/document-request-status'
import { DocumentRequestType } from '../../enterprise/entities/value-objects/document-request-type'

import { ConfirmUploadDocumentUseCase } from './confirm-upload-document'
import { InMemoryDocumentRepository } from 'test/repositories/prisma/in-memory-document-repository'
import { InMemoryBlobStorageRepository } from 'test/repositories/prisma/in-memory-blob-storage-repository'
import { DocumentFolder } from '../../enterprise/entities/value-objects/document-folders'
import { DocumentRequestNotFoundError } from './errors/document-request-not-found-error'
import { BlobDoesNotExistError } from './errors/blob-does-not-exist-error'

let inMemoryDocumentRepository: InMemoryDocumentRepository
let inMemoryDocumentRequestRepository: InMemoryDocumentRequestRepository
let inMemoryBlobStorageRepository: InMemoryBlobStorageRepository
let sut: ConfirmUploadDocumentUseCase
let mockDocumentRequestId: UniqueEntityId

describe('Confirm upload document', () => {
	beforeEach(() => {
		inMemoryDocumentRepository = new InMemoryDocumentRepository()
		inMemoryDocumentRequestRepository = new InMemoryDocumentRequestRepository()
		inMemoryBlobStorageRepository = new InMemoryBlobStorageRepository()
		sut = new ConfirmUploadDocumentUseCase(
			inMemoryDocumentRepository,
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
		inMemoryBlobStorageRepository.items.push({
			blobName: 'test-blob',
			uploadUrl: 'http://example.com/test-blob',
			size: 1024,
			lastModified: new Date(),
			contentType: 'application/pdf',
		})
	})

	it('should confirm a document upload successfully', async () => {
		const response = await sut.execute({
			blobName: 'test-blob',
			clientId: new UniqueEntityId(),
			contentKey: new UniqueEntityId(),
			name: 'Test Document',
			fileSize: 1024,
			thumbnailBlobName: null,
			folder: DocumentFolder.create('INBOX'),
			uploadedBy: new UniqueEntityId(),
			documentRequestId: mockDocumentRequestId,
		})

		expect(response.isRight()).toBeTruthy()

		expect(response.value).toBeDefined()
		expect(response.value).toEqual({
			document: inMemoryDocumentRepository.items[0],
		})
	})

	it('should fail if there is no document request', async () => {
		const response = await sut.execute({
			blobName: 'test-blob',
			clientId: new UniqueEntityId(),
			contentKey: new UniqueEntityId(),
			name: 'Test Document',
			fileSize: 1024,
			thumbnailBlobName: null,
			folder: DocumentFolder.create('INBOX'),
			uploadedBy: new UniqueEntityId(),
			documentRequestId: new UniqueEntityId(),
		})

		expect(response.isLeft()).toBeTruthy()
		expect(response.value).toEqual(new DocumentRequestNotFoundError())
	})

	it('should fail if there is no blob in the blob storage', async () => {
		const response = await sut.execute({
			blobName: 'non-existent-blob',
			clientId: new UniqueEntityId(),
			contentKey: new UniqueEntityId(),
			name: 'Test Document',
			fileSize: 1024,
			thumbnailBlobName: null,
			folder: DocumentFolder.create('INBOX'),
			uploadedBy: new UniqueEntityId(),
			documentRequestId: mockDocumentRequestId,
		})

		expect(response.isLeft()).toBeTruthy()
		expect(response.value).toEqual(
			new BlobDoesNotExistError('non-existent-blob'),
		)
	})
})
