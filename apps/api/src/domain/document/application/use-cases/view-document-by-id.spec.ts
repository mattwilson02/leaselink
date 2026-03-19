import { InMemoryDocumentRepository } from 'test/repositories/prisma/in-memory-document-repository.js'
import { ViewDocumentByIdUseCase } from './view-document-by-id.js'
import { Document } from '../../enterprise/entities/document.js'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DocumentFolder } from '../../enterprise/entities/value-objects/document-folders.js'
import { DocumentNotFoundError } from './errors/document-not-found-error'
import { DocumentNotClientsError } from './errors/document-not-client-error'

let documentRepository: InMemoryDocumentRepository
let sut: ViewDocumentByIdUseCase

describe('View Document by Id', () => {
	beforeEach(() => {
		documentRepository = new InMemoryDocumentRepository()
		sut = new ViewDocumentByIdUseCase(documentRepository)
	})

	it('should view a document and update viewedAt timestamp', async () => {
		const clientId = new UniqueEntityId()
		const documentId = new UniqueEntityId()

		const document = Document.create(
			{
				clientId,
				name: 'Test Document',
				contentKey: new UniqueEntityId('doc-1'),
				version: 1,
				blobName: 'test.pdf',
				thumbnailBlobName: 'test-thumb.png',
				fileSize: 12345,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date(),
				viewedAt: null,
			},
			documentId,
		)

		documentRepository.items.push(document)

		const result = await sut.execute({
			documentId: documentId.toString(),
			clientId: clientId.toString(),
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.document.id.toString()).toBe(documentId.toString())
			expect(result.value.document.name).toBe('Test Document')
		}

		// Verify that viewedAt was updated
		const updatedDocument = documentRepository.items.find(
			(doc) => doc.id.toString() === documentId.toString(),
		)
		expect(updatedDocument?.viewedAt).not.toBeNull()
		expect(updatedDocument?.viewedAt).toBeInstanceOf(Date)
	})

	it('should return DocumentNotFoundError if document does not exist', async () => {
		const clientId = new UniqueEntityId()
		const nonExistentDocumentId = new UniqueEntityId()

		const result = await sut.execute({
			documentId: nonExistentDocumentId.toString(),
			clientId: clientId.toString(),
		})

		expect(result.isLeft()).toBeTruthy()
		if (result.isLeft()) {
			expect(result.value).toBeInstanceOf(DocumentNotFoundError)
		}
	})

	it('should return DocumentNotClientsError if document belongs to another client', async () => {
		const clientId1 = new UniqueEntityId()
		const clientId2 = new UniqueEntityId()
		const documentId = new UniqueEntityId()

		const document = Document.create(
			{
				clientId: clientId1,
				name: 'Client 1 Document',
				contentKey: new UniqueEntityId('doc-1'),
				version: 1,
				blobName: 'test.pdf',
				thumbnailBlobName: 'test-thumb.png',
				fileSize: 12345,
				folder: DocumentFolder.create(),
				uploadedBy: clientId1,
				updatedAt: new Date(),
				createdAt: new Date(),
				viewedAt: null,
			},
			documentId,
		)

		documentRepository.items.push(document)

		const result = await sut.execute({
			documentId: documentId.toString(),
			clientId: clientId2.toString(),
		})

		expect(result.isLeft()).toBeTruthy()
		if (result.isLeft()) {
			expect(result.value).toBeInstanceOf(DocumentNotClientsError)
		}

		// Verify that viewedAt was NOT updated
		const unchangedDocument = documentRepository.items.find(
			(doc) => doc.id.toString() === documentId.toString(),
		)
		expect(unchangedDocument?.viewedAt).toBeNull()
	})

	it('should update viewedAt even if document was previously viewed', async () => {
		const clientId = new UniqueEntityId()
		const documentId = new UniqueEntityId()
		const previousViewDate = new Date('2024-01-01')

		const document = Document.create(
			{
				clientId,
				name: 'Previously Viewed Document',
				contentKey: new UniqueEntityId('doc-1'),
				version: 1,
				blobName: 'test.pdf',
				thumbnailBlobName: 'test-thumb.png',
				fileSize: 12345,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date(),
				viewedAt: previousViewDate,
			},
			documentId,
		)

		documentRepository.items.push(document)

		const result = await sut.execute({
			documentId: documentId.toString(),
			clientId: clientId.toString(),
		})

		expect(result.isRight()).toBeTruthy()

		// Verify that viewedAt was updated to a new timestamp
		const updatedDocument = documentRepository.items.find(
			(doc) => doc.id.toString() === documentId.toString(),
		)
		expect(updatedDocument?.viewedAt).not.toBeNull()
		expect(updatedDocument?.viewedAt?.getTime()).toBeGreaterThan(
			previousViewDate.getTime(),
		)
	})

	it('should handle viewing multiple documents by the same client', async () => {
		const clientId = new UniqueEntityId()
		const documentId1 = new UniqueEntityId()
		const documentId2 = new UniqueEntityId()

		const doc1 = Document.create(
			{
				clientId,
				name: 'Document 1',
				contentKey: new UniqueEntityId('doc-1'),
				version: 1,
				blobName: 'test1.pdf',
				thumbnailBlobName: 'test1-thumb.png',
				fileSize: 12345,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date(),
				viewedAt: null,
			},
			documentId1,
		)

		const doc2 = Document.create(
			{
				clientId,
				name: 'Document 2',
				contentKey: new UniqueEntityId('doc-2'),
				version: 1,
				blobName: 'test2.pdf',
				thumbnailBlobName: 'test2-thumb.png',
				fileSize: 67890,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date(),
				viewedAt: null,
			},
			documentId2,
		)

		documentRepository.items.push(doc1, doc2)

		// View first document
		const result1 = await sut.execute({
			documentId: documentId1.toString(),
			clientId: clientId.toString(),
		})

		expect(result1.isRight()).toBeTruthy()

		// View second document
		const result2 = await sut.execute({
			documentId: documentId2.toString(),
			clientId: clientId.toString(),
		})

		expect(result2.isRight()).toBeTruthy()

		// Both documents should have viewedAt set
		const updatedDoc1 = documentRepository.items.find(
			(doc) => doc.id.toString() === documentId1.toString(),
		)
		const updatedDoc2 = documentRepository.items.find(
			(doc) => doc.id.toString() === documentId2.toString(),
		)

		expect(updatedDoc1?.viewedAt).not.toBeNull()
		expect(updatedDoc2?.viewedAt).not.toBeNull()
	})

	it('should only update viewedAt for the specific document version', async () => {
		const clientId = new UniqueEntityId()
		const contentKey = new UniqueEntityId('doc-1')
		const docV1Id = new UniqueEntityId()
		const docV2Id = new UniqueEntityId()

		const docV1 = Document.create(
			{
				clientId,
				name: 'Document v1',
				contentKey,
				version: 1,
				blobName: 'test_v1.pdf',
				thumbnailBlobName: 'test_v1-thumb.png',
				fileSize: 12345,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date(),
				viewedAt: null,
			},
			docV1Id,
		)

		const docV2 = Document.create(
			{
				clientId,
				name: 'Document v2',
				contentKey,
				version: 2,
				blobName: 'test_v2.pdf',
				thumbnailBlobName: 'test_v2-thumb.png',
				fileSize: 23456,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date(),
				viewedAt: null,
			},
			docV2Id,
		)

		documentRepository.items.push(docV1, docV2)

		// View only version 2
		const result = await sut.execute({
			documentId: docV2Id.toString(),
			clientId: clientId.toString(),
		})

		expect(result.isRight()).toBeTruthy()

		// Only v2 should have viewedAt updated
		const updatedDocV1 = documentRepository.items.find(
			(doc) => doc.id.toString() === docV1Id.toString(),
		)
		const updatedDocV2 = documentRepository.items.find(
			(doc) => doc.id.toString() === docV2Id.toString(),
		)

		expect(updatedDocV1?.viewedAt).toBeNull()
		expect(updatedDocV2?.viewedAt).not.toBeNull()
	})
})
