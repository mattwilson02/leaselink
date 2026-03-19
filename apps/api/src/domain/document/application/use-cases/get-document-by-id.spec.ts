import { InMemoryDocumentRepository } from 'test/repositories/prisma/in-memory-document-repository'
import { InMemoryBlobStorageRepository } from 'test/repositories/prisma/in-memory-blob-storage-repository'
import { GetDocumentByIdUseCase } from './get-document-by-id'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DocumentNotFoundError } from './errors/document-not-found-error'
import { Document } from '../../enterprise/entities/document'
import { DocumentFolder } from '../../enterprise/entities/value-objects/document-folders'

describe('GetDocumentByIdUseCase', () => {
	let documentRepository: InMemoryDocumentRepository
	let blobStorageRepository: InMemoryBlobStorageRepository
	let sut: GetDocumentByIdUseCase

	beforeEach(() => {
		documentRepository = new InMemoryDocumentRepository()
		blobStorageRepository = new InMemoryBlobStorageRepository()
		sut = new GetDocumentByIdUseCase(documentRepository, blobStorageRepository)
	})

	it('should return the document if it exists', async () => {
		const documentId = new UniqueEntityId().toString()
		const document = Document.create(
			{
				name: 'Test Document',
				blobName: 'test-blob',
				fileSize: 1024,
				contentKey: new UniqueEntityId(),
				uploadedBy: new UniqueEntityId(),
				clientId: new UniqueEntityId('test-client-id'),
				folder: DocumentFolder.create('IDENTIFICATION'),
				thumbnailBlobName: null,
				version: 1,
				createdAt: new Date(),
			},
			new UniqueEntityId(documentId),
		)

		documentRepository.items.push(document)

		const result = await sut.execute({ documentId })

		expect(result.isRight()).toBe(true)
		expect(result.value).toEqual({
			document: expect.objectContaining({
				id: new UniqueEntityId(documentId),
				name: 'Test Document',
			}),
		})
	})

	it('should return the document with thumbnailDownloadUrl if thumbnailBlobName is set and blob exists', async () => {
		const documentId = new UniqueEntityId().toString()
		const thumbnailBlobName = 'thumbnail-blob'
		const document = Document.create(
			{
				name: 'Test Document With Thumbnail',
				blobName: 'test-blob',
				fileSize: 2048,
				contentKey: new UniqueEntityId(),
				uploadedBy: new UniqueEntityId(),
				clientId: new UniqueEntityId('test-client-id'),
				folder: DocumentFolder.create('IDENTIFICATION'),
				thumbnailBlobName,
				version: 1,
				createdAt: new Date(),
			},
			new UniqueEntityId(documentId),
		)

		documentRepository.items.push(document)
		blobStorageRepository.items.push({
			blobName: thumbnailBlobName,
			uploadUrl: 'https://example.com/upload',
			size: 1234,
			lastModified: new Date(),
			contentType: 'image/png',
		})

		const result = await sut.execute({ documentId })

		expect(result.isRight()).toBe(true)
		const value = result.value
		expect(value).toEqual({
			document: expect.objectContaining({
				thumbnailDownloadUrl: expect.stringContaining(
					'https://example.com/download/',
				),
				name: 'Test Document With Thumbnail',
			}),
		})
	})

	it('should return 404 if the document does not exist', async () => {
		const nonExistentId = new UniqueEntityId().toString()

		const result = await sut.execute({ documentId: nonExistentId })

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(DocumentNotFoundError)
	})
})
