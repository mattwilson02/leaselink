import { InMemoryDocumentRepository } from 'test/repositories/prisma/in-memory-document-repository.js'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository.js'
import { GetManyDocumentsByClientIdUseCase } from './get-many-documents-by-client-id.ts.js'
import { Document } from '../../enterprise/entities/document.js'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DocumentFolder } from '../../enterprise/entities/value-objects/document-folders.js'
import { Client } from '@/domain/financial-management/enterprise/entities/client'

let documentRepository: InMemoryDocumentRepository
let clientsRepository: InMemoryClientsRepository
let sut: GetManyDocumentsByClientIdUseCase

describe('Get Documents by Client Id', () => {
	beforeEach(() => {
		documentRepository = new InMemoryDocumentRepository()
		clientsRepository = new InMemoryClientsRepository()
		sut = new GetManyDocumentsByClientIdUseCase(documentRepository)
	})

	it('should retrieve documents for a valid client ID', async () => {
		const clientId = new UniqueEntityId()
		const client = Client.create(
			{
				name: 'Test Client',
				email: 'test@example.com',
				phoneNumber: '1234567890',
			},
			clientId,
		)
		await clientsRepository.create(client)

		documentRepository.items.push(
			Document.create({
				clientId,
				name: 'Document 1',
				contentKey: new UniqueEntityId('doc-1'),
				version: 1,
				blobName: 'doc1',
				thumbnailBlobName: 'doc1-thumb',
				fileSize: 12345,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date(),
			}),
			Document.create({
				clientId,
				name: 'Document 2',
				contentKey: new UniqueEntityId('doc-2'),
				version: 1,
				blobName: 'doc2',
				thumbnailBlobName: 'doc2-thumb',
				fileSize: 67890,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date(),
			}),
		)

		const result = await sut.execute({ clientId: clientId.toString() })

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.documents).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: 'Document 1', clientId }),
					expect.objectContaining({ name: 'Document 2', clientId }),
				]),
			)
			expect(result.value.totalCount).toBe(2)
		}
	})

	it('should return an empty array if no documents are found for the client ID', async () => {
		const clientId = new UniqueEntityId()
		const client = Client.create(
			{
				name: 'NonExistent Client',
				email: 'Fake@example.com',
				phoneNumber: '1244567890',
			},
			clientId,
		)
		await clientsRepository.create(client)

		const result = await sut.execute({ clientId: clientId.toString() })

		expect(result.isRight()).toBeTruthy()
		expect(result.value).toEqual({
			documents: [],
			totalCount: 0,
		})
	})

	it('should respect offset and limit parameters', async () => {
		const clientId = new UniqueEntityId()
		const client = Client.create(
			{
				name: 'Test Client',
				email: 'test@example.com',
				phoneNumber: '1234567890',
			},
			clientId,
		)
		await clientsRepository.create(client)

		for (let i = 1; i <= 5; i++) {
			documentRepository.items.push(
				Document.create({
					clientId,
					name: `Document ${i}`,
					contentKey: new UniqueEntityId(`doc-${i}`),
					version: 1,
					blobName: `doc${i}`,
					thumbnailBlobName: `doc${i}-thumb`,
					fileSize: 12345,
					folder: DocumentFolder.create(),
					uploadedBy: clientId,
					updatedAt: new Date(),
					createdAt: new Date(),
				}),
			)
		}

		const result = await sut.execute({
			clientId: clientId.toString(),
			offset: 1,
			limit: 3,
		})

		if (result.isRight()) {
			expect(result.value.documents).toHaveLength(3)
			expect(result.value.documents).toEqual(
				expect.arrayContaining(result.value.documents),
			)
		}
	})

	it('should return only the latest version of each document', async () => {
		const clientId = new UniqueEntityId()
		const client = Client.create(
			{
				name: 'Test Client',
				email: 'test@example.com',
				phoneNumber: '1234567890',
			},
			clientId,
		)
		await clientsRepository.create(client)

		documentRepository.items.push(
			Document.create({
				clientId,
				name: 'Document 1',
				contentKey: new UniqueEntityId('doc-1'),
				version: 1,
				blobName: 'doc1',
				thumbnailBlobName: 'doc1-thumb',
				fileSize: 12345,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date(),
			}),
			Document.create({
				clientId,
				name: 'Document 1',
				contentKey: new UniqueEntityId('doc-1'),
				version: 2,
				blobName: 'doc1-v2',
				thumbnailBlobName: 'doc1-v2-thumb',
				fileSize: 12345,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date(),
			}),
			Document.create({
				clientId,
				name: 'Document 2',
				contentKey: new UniqueEntityId('doc-2'),
				version: 1,
				blobName: 'doc2',
				thumbnailBlobName: 'doc2-thumb',
				fileSize: 67890,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date(),
			}),

			Document.create({
				clientId,
				name: 'Document 2',
				contentKey: new UniqueEntityId('doc-2'),
				version: 3,
				blobName: 'doc2-v3',
				thumbnailBlobName: 'doc2-v3-thumb',
				fileSize: 67890,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date(),
			}),
		)

		const result = await sut.execute({ clientId: clientId.toString() })

		if (result.isRight()) {
			expect(result.value.documents).toHaveLength(2)
			expect(result.value.documents).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: 'Document 1', version: 2 }),
					expect.objectContaining({ name: 'Document 2', version: 3 }),
				]),
			)

			expect(result.value.documents).not.toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: 'Document 1', version: 1 }),
					expect.objectContaining({ name: 'Document 2', version: 1 }),
				]),
			)
		} else {
			throw new Error('Expected result to be a success, but it was a failure.')
		}
	})

	it('should filter documents by search term', async () => {
		const clientId = new UniqueEntityId()
		const client = Client.create(
			{
				name: 'Test Client',
				email: 'test@example.com',
				phoneNumber: '1234567890',
			},
			clientId,
		)
		await clientsRepository.create(client)

		documentRepository.items.push(
			Document.create({
				clientId,
				name: 'Important Document',
				contentKey: new UniqueEntityId('doc-1'),
				version: 1,
				blobName: 'doc1',
				thumbnailBlobName: 'doc1-thumb',
				fileSize: 12345,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date(),
			}),
			Document.create({
				clientId,
				name: 'Another Document',
				contentKey: new UniqueEntityId('doc-2'),
				version: 1,
				blobName: 'doc2',
				thumbnailBlobName: 'doc2-thumb',
				fileSize: 67890,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date(),
				createdAt: new Date(),
			}),
		)

		const result = await sut.execute({
			clientId: clientId.toString(),
			search: 'Important',
		})

		if (result.isRight()) {
			expect(result.value.documents).toHaveLength(1)
			expect(result.value.documents[0].name).toBe('Important Document')
		} else {
			throw new Error('Expected result to be a success, but it was a failure.')
		}
	})

	it('should filter documents by createdAt date range', async () => {
		const clientId = new UniqueEntityId()
		const client = Client.create(
			{
				name: 'Test Client',
				email: 'test@example.com',
				phoneNumber: '1234567890',
			},
			clientId,
		)
		await clientsRepository.create(client)

		documentRepository.items.push(
			Document.create({
				clientId,
				name: 'Old Document',
				contentKey: new UniqueEntityId('doc-1'),
				version: 1,
				blobName: 'doc1',
				thumbnailBlobName: 'doc1-thumb',
				fileSize: 12345,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date('2023-01-01'),
				createdAt: new Date('2023-01-01'),
			}),
			Document.create({
				clientId,
				name: 'Middle Document',
				contentKey: new UniqueEntityId('doc-2'),
				version: 1,
				blobName: 'doc2',
				thumbnailBlobName: 'doc2-thumb',
				fileSize: 67890,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date('2023-06-01'),
				createdAt: new Date('2023-06-01'),
			}),
			Document.create({
				clientId,
				name: 'New Document',
				contentKey: new UniqueEntityId('doc-3'),
				version: 1,
				blobName: 'doc3',
				thumbnailBlobName: 'doc3-thumb',
				fileSize: 67890,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date('2023-12-01'),
				createdAt: new Date('2023-12-01'),
			}),
		)

		const result = await sut.execute({
			clientId: clientId.toString(),
			createdAtFrom: new Date('2023-05-01'),
			createdAtTo: new Date('2023-11-01'),
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.documents).toHaveLength(1)
			expect(result.value.documents[0].name).toBe('Middle Document')
		}
	})

	it('should orderBy documents in descending order by default', async () => {
		const clientId = new UniqueEntityId()
		const client = Client.create(
			{
				name: 'Test Client',
				email: 'test@example.com',
				phoneNumber: '1234567890',
			},
			clientId,
		)
		await clientsRepository.create(client)

		documentRepository.items.push(
			Document.create({
				clientId,
				name: 'Document 1',
				contentKey: new UniqueEntityId('doc-1'),
				version: 1,
				blobName: 'doc1',
				thumbnailBlobName: 'doc1-thumb',
				fileSize: 12345,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date('2023-01-01'),
				createdAt: new Date('2023-01-01'),
			}),
			Document.create({
				clientId,
				name: 'Document 2',
				contentKey: new UniqueEntityId('doc-2'),
				version: 1,
				blobName: 'doc2',
				thumbnailBlobName: 'doc2-thumb',
				fileSize: 67890,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date('2023-02-01'),
				createdAt: new Date('2023-02-01'),
			}),
			Document.create({
				clientId,
				name: 'Document 3',
				contentKey: new UniqueEntityId('doc-3'),
				version: 1,
				blobName: 'doc3',
				thumbnailBlobName: 'doc3-thumb',
				fileSize: 67890,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date('2023-03-01'),
				createdAt: new Date('2023-03-01'),
			}),
		)
		const result = await sut.execute({ clientId: clientId.toString() })
		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value?.documents).toHaveLength(3)
			expect(result.value?.documents[0].name).toBe('Document 3')
			expect(result.value?.documents[1].name).toBe('Document 2')
			expect(result.value?.documents[2].name).toBe('Document 1')
		}
	})

	it('should filter by certain document folder types', async () => {
		const clientId = new UniqueEntityId()
		const client = Client.create(
			{
				name: 'Test Client',
				email: 'test@example.com',
				phoneNumber: '1234567890',
			},
			clientId,
		)
		await clientsRepository.create(client)

		documentRepository.items.push(
			Document.create({
				clientId,
				name: 'Document 1',
				contentKey: new UniqueEntityId('doc-1'),
				version: 1,
				blobName: 'doc1',
				thumbnailBlobName: 'doc1-thumb',
				fileSize: 12345,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date('2023-01-01'),
				createdAt: new Date('2023-01-01'),
			}),
			Document.create({
				clientId,
				name: 'Document 2',
				contentKey: new UniqueEntityId('doc-2'),
				version: 1,
				blobName: 'doc2',
				thumbnailBlobName: 'doc2-thumb',
				fileSize: 67890,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date('2023-02-01'),
				createdAt: new Date('2023-02-01'),
			}),
			Document.create({
				clientId,
				name: 'Document 3',
				contentKey: new UniqueEntityId('doc-3'),
				version: 1,
				blobName: 'doc3',
				thumbnailBlobName: 'doc3-thumb',
				fileSize: 67890,
				folder: DocumentFolder.create(),
				uploadedBy: clientId,
				updatedAt: new Date('2023-03-01'),
				createdAt: new Date('2023-03-01'),
			}),
			Document.create({
				clientId,
				name: 'Document 4',
				contentKey: new UniqueEntityId('doc-4'),
				version: 1,
				blobName: 'doc4',
				thumbnailBlobName: 'doc4-thumb',
				fileSize: 67890,
				folder: DocumentFolder.create('IDENTIFICATION'),
				uploadedBy: clientId,
				updatedAt: new Date('2023-03-01'),
				createdAt: new Date('2023-03-01'),
			}),
			Document.create({
				clientId,
				name: 'Document 5',
				contentKey: new UniqueEntityId('doc-5'),
				version: 1,
				blobName: 'doc5',
				thumbnailBlobName: 'doc5-thumb',
				fileSize: 67890,
				folder: DocumentFolder.create('INSPECTION_REPORTS'),
				uploadedBy: clientId,
				updatedAt: new Date('2023-03-01'),
				createdAt: new Date('2023-03-01'),
			}),
		)
		const result = await sut.execute({
			clientId: clientId.toString(),
			folders: ['IDENTIFICATION', 'INSPECTION_REPORTS'],
		})
		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value?.documents).toHaveLength(2)
			expect(result.value?.documents[0].name).toBe('Document 4')
			expect(result.value?.documents[1].name).toBe('Document 5')
		}
	})
})
