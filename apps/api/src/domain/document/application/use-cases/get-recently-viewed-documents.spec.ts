import { InMemoryDocumentRepository } from 'test/repositories/prisma/in-memory-document-repository.js'
import { GetRecentlyViewedDocumentsUseCase } from './get-recently-viewed-documents.js'
import { Document } from '../../enterprise/entities/document.js'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DocumentFolder } from '../../enterprise/entities/value-objects/document-folders.js'

let documentRepository: InMemoryDocumentRepository
let sut: GetRecentlyViewedDocumentsUseCase

describe('Get Recently Viewed Documents', () => {
	beforeEach(() => {
		documentRepository = new InMemoryDocumentRepository()
		sut = new GetRecentlyViewedDocumentsUseCase(documentRepository)
	})

	it('should retrieve recently viewed documents sorted by viewedAt date', async () => {
		const clientId = new UniqueEntityId()

		const doc1 = Document.create({
			clientId,
			name: 'Document 1',
			contentKey: new UniqueEntityId('doc-1'),
			version: 1,
			blobName: 'doc1.pdf',
			thumbnailBlobName: 'doc1-thumb.png',
			fileSize: 12345,
			folder: DocumentFolder.create(),
			uploadedBy: clientId,
			updatedAt: new Date(),
			createdAt: new Date('2024-01-01'),
			viewedAt: new Date('2024-01-10'),
		})

		const doc2 = Document.create({
			clientId,
			name: 'Document 2',
			contentKey: new UniqueEntityId('doc-2'),
			version: 1,
			blobName: 'doc2.pdf',
			thumbnailBlobName: 'doc2-thumb.png',
			fileSize: 67890,
			folder: DocumentFolder.create(),
			uploadedBy: clientId,
			updatedAt: new Date(),
			createdAt: new Date('2024-01-02'),
			viewedAt: new Date('2024-01-15'),
		})

		const doc3 = Document.create({
			clientId,
			name: 'Document 3',
			contentKey: new UniqueEntityId('doc-3'),
			version: 1,
			blobName: 'doc3.pdf',
			thumbnailBlobName: 'doc3-thumb.png',
			fileSize: 11111,
			folder: DocumentFolder.create(),
			uploadedBy: clientId,
			updatedAt: new Date(),
			createdAt: new Date('2024-01-03'),
			viewedAt: new Date('2024-01-05'),
		})

		documentRepository.items.push(doc1, doc2, doc3)

		const result = await sut.execute({ clientId: clientId.toString() })

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.documents).toHaveLength(3)
			// Should be sorted by viewedAt descending (most recent first)
			expect(result.value.documents[0].name).toBe('Document 2')
			expect(result.value.documents[1].name).toBe('Document 1')
			expect(result.value.documents[2].name).toBe('Document 3')
		}
	})

	it('should return an empty array if no documents have been viewed', async () => {
		const clientId = new UniqueEntityId()

		const doc1 = Document.create({
			clientId,
			name: 'Document 1',
			contentKey: new UniqueEntityId('doc-1'),
			version: 1,
			blobName: 'doc1.pdf',
			thumbnailBlobName: 'doc1-thumb.png',
			fileSize: 12345,
			folder: DocumentFolder.create(),
			uploadedBy: clientId,
			updatedAt: new Date(),
			createdAt: new Date('2024-01-01'),
			viewedAt: null,
		})

		documentRepository.items.push(doc1)

		const result = await sut.execute({ clientId: clientId.toString() })

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.documents).toEqual([])
		}
	})

	it('should return only documents for the specified client', async () => {
		const clientId1 = new UniqueEntityId()
		const clientId2 = new UniqueEntityId()

		const doc1 = Document.create({
			clientId: clientId1,
			name: 'Client 1 Document',
			contentKey: new UniqueEntityId('doc-1'),
			version: 1,
			blobName: 'doc1.pdf',
			thumbnailBlobName: 'doc1-thumb.png',
			fileSize: 12345,
			folder: DocumentFolder.create(),
			uploadedBy: clientId1,
			updatedAt: new Date(),
			createdAt: new Date('2024-01-01'),
			viewedAt: new Date('2024-01-10'),
		})

		const doc2 = Document.create({
			clientId: clientId2,
			name: 'Client 2 Document',
			contentKey: new UniqueEntityId('doc-2'),
			version: 1,
			blobName: 'doc2.pdf',
			thumbnailBlobName: 'doc2-thumb.png',
			fileSize: 67890,
			folder: DocumentFolder.create(),
			uploadedBy: clientId2,
			updatedAt: new Date(),
			createdAt: new Date('2024-01-02'),
			viewedAt: new Date('2024-01-15'),
		})

		documentRepository.items.push(doc1, doc2)

		const result = await sut.execute({ clientId: clientId1.toString() })

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.documents).toHaveLength(1)
			expect(result.value.documents[0].name).toBe('Client 1 Document')
		}
	})

	it('should respect the limit parameter', async () => {
		const clientId = new UniqueEntityId()

		for (let i = 0; i < 15; i++) {
			const doc = Document.create({
				clientId,
				name: `Document ${i}`,
				contentKey: new UniqueEntityId(`doc-${i}`),
				version: 1,
				blobName: `doc${i}.pdf`,
				thumbnailBlobName: `doc${i}-thumb.png`,
				fileSize: 12345,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date('2024-01-01'),
				viewedAt: new Date(2024, 0, i + 1),
			})
			documentRepository.items.push(doc)
		}

		const result = await sut.execute({
			clientId: clientId.toString(),
			limit: 5,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.documents).toHaveLength(5)
		}
	})

	it('should default to limit of 10 when not specified', async () => {
		const clientId = new UniqueEntityId()

		for (let i = 0; i < 15; i++) {
			const doc = Document.create({
				clientId,
				name: `Document ${i}`,
				contentKey: new UniqueEntityId(`doc-${i}`),
				version: 1,
				blobName: `doc${i}.pdf`,
				thumbnailBlobName: `doc${i}-thumb.png`,
				fileSize: 12345,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date('2024-01-01'),
				viewedAt: new Date(2024, 0, i + 1),
			})
			documentRepository.items.push(doc)
		}

		const result = await sut.execute({ clientId: clientId.toString() })

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.documents).toHaveLength(10)
		}
	})

	it('should return only the latest version of each document', async () => {
		const clientId = new UniqueEntityId()
		const contentKey = new UniqueEntityId('doc-1')

		// Create multiple versions of the same document
		const doc1v1 = Document.create({
			clientId,
			name: 'Document v1',
			contentKey,
			version: 1,
			blobName: 'doc1v1.pdf',
			thumbnailBlobName: 'doc1v1-thumb.png',
			fileSize: 12345,
			folder: DocumentFolder.create(),
			uploadedBy: clientId,
			updatedAt: new Date(),
			createdAt: new Date('2024-01-01'),
			viewedAt: new Date('2024-01-10'),
		})

		const doc1v2 = Document.create({
			clientId,
			name: 'Document v2',
			contentKey,
			version: 2,
			blobName: 'doc1v2.pdf',
			thumbnailBlobName: 'doc1v2-thumb.png',
			fileSize: 12345,
			folder: DocumentFolder.create(),
			uploadedBy: clientId,
			updatedAt: new Date(),
			createdAt: new Date('2024-01-02'),
			viewedAt: new Date('2024-01-12'),
		})

		const doc1v3 = Document.create({
			clientId,
			name: 'Document v3',
			contentKey,
			version: 3,
			blobName: 'doc1v3.pdf',
			thumbnailBlobName: 'doc1v3-thumb.png',
			fileSize: 12345,
			folder: DocumentFolder.create(),
			uploadedBy: clientId,
			updatedAt: new Date(),
			createdAt: new Date('2024-01-03'),
			viewedAt: new Date('2024-01-15'),
		})

		documentRepository.items.push(doc1v1, doc1v2, doc1v3)

		const result = await sut.execute({ clientId: clientId.toString() })

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.documents).toHaveLength(1)
			expect(result.value.documents[0].version).toBe(3)
			expect(result.value.documents[0].name).toBe('Document v3')
		}
	})

	it('should handle case with no documents for client', async () => {
		const clientId = new UniqueEntityId()

		const result = await sut.execute({ clientId: clientId.toString() })

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.documents).toEqual([])
		}
	})

	it('should filter documents by folderName when specified', async () => {
		const clientId = new UniqueEntityId()

		const docIdentification = Document.create({
			clientId,
			name: 'ID Document',
			contentKey: new UniqueEntityId('doc-1'),
			version: 1,
			blobName: 'id.pdf',
			thumbnailBlobName: 'id-thumb.png',
			fileSize: 12345,
			folder: DocumentFolder.create('IDENTIFICATION'),
			uploadedBy: clientId,
			updatedAt: new Date(),
			createdAt: new Date('2024-01-01'),
			viewedAt: new Date('2024-01-10'),
		})

		const docTax = Document.create({
			clientId,
			name: 'Tax Document',
			contentKey: new UniqueEntityId('doc-2'),
			version: 1,
			blobName: 'tax.pdf',
			thumbnailBlobName: 'tax-thumb.png',
			fileSize: 67890,
			folder: DocumentFolder.create('INSURANCE'),
			uploadedBy: clientId,
			updatedAt: new Date(),
			createdAt: new Date('2024-01-02'),
			viewedAt: new Date('2024-01-15'),
		})

		const docInvestment = Document.create({
			clientId,
			name: 'Investment Statement',
			contentKey: new UniqueEntityId('doc-3'),
			version: 1,
			blobName: 'investment.pdf',
			thumbnailBlobName: 'investment-thumb.png',
			fileSize: 11111,
			folder: DocumentFolder.create('LEASE_AGREEMENTS'),
			uploadedBy: clientId,
			updatedAt: new Date(),
			createdAt: new Date('2024-01-03'),
			viewedAt: new Date('2024-01-12'),
		})

		documentRepository.items.push(docIdentification, docTax, docInvestment)

		const result = await sut.execute({
			clientId: clientId.toString(),
			folderName: 'INSURANCE',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.documents).toHaveLength(1)
			expect(result.value.documents[0].name).toBe('Tax Document')
			expect(result.value.documents[0].folder.value).toBe('INSURANCE')
		}
	})

	it('should return empty array when filtering by folderName with no matches', async () => {
		const clientId = new UniqueEntityId()

		const docIdentification = Document.create({
			clientId,
			name: 'ID Document',
			contentKey: new UniqueEntityId('doc-1'),
			version: 1,
			blobName: 'id.pdf',
			thumbnailBlobName: 'id-thumb.png',
			fileSize: 12345,
			folder: DocumentFolder.create('IDENTIFICATION'),
			uploadedBy: clientId,
			updatedAt: new Date(),
			createdAt: new Date('2024-01-01'),
			viewedAt: new Date('2024-01-10'),
		})

		documentRepository.items.push(docIdentification)

		const result = await sut.execute({
			clientId: clientId.toString(),
			folderName: 'INSURANCE',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.documents).toEqual([])
		}
	})

	it('should filter by folderName and respect limit', async () => {
		const clientId = new UniqueEntityId()

		// Create 10 tax documents
		for (let i = 0; i < 10; i++) {
			const doc = Document.create({
				clientId,
				name: `Tax Document ${i}`,
				contentKey: new UniqueEntityId(`tax-doc-${i}`),
				version: 1,
				blobName: `tax${i}.pdf`,
				thumbnailBlobName: `tax${i}-thumb.png`,
				fileSize: 12345,
				folder: DocumentFolder.create('INSURANCE'),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date('2024-01-01'),
				viewedAt: new Date(2024, 0, i + 1),
			})
			documentRepository.items.push(doc)
		}

		// Create 5 identification documents
		for (let i = 0; i < 5; i++) {
			const doc = Document.create({
				clientId,
				name: `ID Document ${i}`,
				contentKey: new UniqueEntityId(`id-doc-${i}`),
				version: 1,
				blobName: `id${i}.pdf`,
				thumbnailBlobName: `id${i}-thumb.png`,
				fileSize: 12345,
				folder: DocumentFolder.create('IDENTIFICATION'),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date('2024-01-01'),
				viewedAt: new Date(2024, 0, i + 1),
			})
			documentRepository.items.push(doc)
		}

		const result = await sut.execute({
			clientId: clientId.toString(),
			folderName: 'INSURANCE',
			limit: 3,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.documents).toHaveLength(3)
			// All documents should be from INSURANCE folder
			for (const doc of result.value.documents) {
				expect(doc.folder.value).toBe('INSURANCE')
			}
		}
	})

	it('should filter by folderName and still return only latest versions', async () => {
		const clientId = new UniqueEntityId()
		const contentKey = new UniqueEntityId('doc-1')

		// Create multiple versions of the same INSURANCE document
		const docV1 = Document.create({
			clientId,
			name: 'Tax Document v1',
			contentKey,
			version: 1,
			blobName: 'tax_v1.pdf',
			thumbnailBlobName: 'tax_v1-thumb.png',
			fileSize: 12345,
			folder: DocumentFolder.create('INSURANCE'),
			uploadedBy: clientId,
			updatedAt: new Date(),
			createdAt: new Date('2024-01-01'),
			viewedAt: new Date('2024-01-10'),
		})

		const docV2 = Document.create({
			clientId,
			name: 'Tax Document v2',
			contentKey,
			version: 2,
			blobName: 'tax_v2.pdf',
			thumbnailBlobName: 'tax_v2-thumb.png',
			fileSize: 23456,
			folder: DocumentFolder.create('INSURANCE'),
			uploadedBy: clientId,
			updatedAt: new Date(),
			createdAt: new Date('2024-01-02'),
			viewedAt: new Date('2024-01-15'),
		})

		// Add a document from a different folder
		const docOther = Document.create({
			clientId,
			name: 'ID Document',
			contentKey: new UniqueEntityId('doc-2'),
			version: 1,
			blobName: 'id.pdf',
			thumbnailBlobName: 'id-thumb.png',
			fileSize: 11111,
			folder: DocumentFolder.create('IDENTIFICATION'),
			uploadedBy: clientId,
			updatedAt: new Date(),
			createdAt: new Date('2024-01-03'),
			viewedAt: new Date('2024-01-20'),
		})

		documentRepository.items.push(docV1, docV2, docOther)

		const result = await sut.execute({
			clientId: clientId.toString(),
			folderName: 'INSURANCE',
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.documents).toHaveLength(1)
			expect(result.value.documents[0].version).toBe(2)
			expect(result.value.documents[0].name).toBe('Tax Document v2')
			expect(result.value.documents[0].folder.value).toBe('INSURANCE')
		}
	})
})
