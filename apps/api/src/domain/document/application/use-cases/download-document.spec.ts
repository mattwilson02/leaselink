import { InMemoryBlobStorageRepository } from 'test/repositories/prisma/in-memory-blob-storage-repository'
import { InMemoryDocumentRepository } from 'test/repositories/prisma/in-memory-document-repository'
import { DownloadDocumentUseCase } from './download-document'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Document } from '../../enterprise/entities/document'
import { DocumentFolder } from '../../enterprise/entities/value-objects/document-folders'
import { BlobDoesNotExistError } from './errors/blob-does-not-exist-error'
import { DocumentNotFoundError } from './errors/document-not-found-error'

let inMemoryBlobStorageRepository: InMemoryBlobStorageRepository
let inMemoryDocumentRepository: InMemoryDocumentRepository
let sut: DownloadDocumentUseCase
let mockDocumentId: UniqueEntityId
let blobName: string

describe('Download Document', () => {
	beforeEach(() => {
		inMemoryBlobStorageRepository = new InMemoryBlobStorageRepository()
		inMemoryDocumentRepository = new InMemoryDocumentRepository()
		sut = new DownloadDocumentUseCase(
			inMemoryDocumentRepository,
			inMemoryBlobStorageRepository,
		)

		blobName = `test-blob-${Date.now()}`
		mockDocumentId = new UniqueEntityId()

		const mockDocument = Document.create(
			{
				clientId: new UniqueEntityId(),
				contentKey: new UniqueEntityId(),
				version: 1,
				name: 'Test Document',
				blobName,
				fileSize: 1024,
				thumbnailBlobName: null,
				folder: DocumentFolder.create(),
				uploadedBy: new UniqueEntityId(),
			},
			mockDocumentId,
		)

		inMemoryDocumentRepository.create(mockDocument)

		inMemoryBlobStorageRepository.items.push({
			blobName,
			uploadUrl: `https://example.com/upload/${blobName}`,
			size: 1024,
			lastModified: new Date(),
			contentType: 'application/pdf',
		})
	})

	it('should return a download URL for a valid document', async () => {
		const result = await sut.execute({ documentId: mockDocumentId.toString() })

		expect(result.isRight()).toBeTruthy()
		expect(result.value).toEqual({
			downloadUrl: `https://example.com/download/${blobName}`,
			blobName,
			expiresOn: expect.any(String),
		})
	})

	it('should return an error if the document does not exist', async () => {
		const result = await sut.execute({
			documentId: new UniqueEntityId('non-existing-id').toString(),
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toEqual(new DocumentNotFoundError('non-existing-id'))
	})

	it('should return an error if the blob does not exist in storage', async () => {
		inMemoryBlobStorageRepository.items = []

		const result = await sut.execute({ documentId: mockDocumentId.toString() })

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toEqual(new BlobDoesNotExistError(blobName))
	})
})
