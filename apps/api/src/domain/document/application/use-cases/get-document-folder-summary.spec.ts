import { GetDocumentFolderSummaryUseCase } from './get-document-folder-summary'
import { InMemoryDocumentRepository } from 'test/repositories/prisma/in-memory-document-repository.js'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository.js'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Client } from '@/domain/financial-management/enterprise/entities/client'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { DocumentsByClientIdNotFoundError } from './errors/documents-by-client-id-not-found-error'
import { Document } from '../../enterprise/entities/document'
import { DocumentFolder } from '../../enterprise/entities/value-objects/document-folders'

describe('GetDocumentFolderSummary', () => {
	let documentRepository: InMemoryDocumentRepository
	let clientsRepository: InMemoryClientsRepository
	let sut: GetDocumentFolderSummaryUseCase

	beforeEach(() => {
		documentRepository = new InMemoryDocumentRepository()
		clientsRepository = new InMemoryClientsRepository()
		sut = new GetDocumentFolderSummaryUseCase(
			documentRepository,
			clientsRepository,
		)
	})

	it('should return ClientNotFoundError if client does not exist', async () => {
		const clientId = 'non-existent-client-id'
		const result = await sut.execute({ clientId })
		expect(result.isLeft()).toBeTruthy()
		if (result.isLeft()) {
			expect(result.value).toBeInstanceOf(ClientNotFoundError)
		}
	})

	it('should return DocumentsByClientIdNotFoundError if no documents found for client', async () => {
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
		const result = await sut.execute({ clientId: clientId.toString() })
		expect(result.isLeft()).toBeTruthy()
		if (result.isLeft()) {
			expect(result.value).toBeInstanceOf(DocumentsByClientIdNotFoundError)
		}
	})

	it('should return documentsByFolder summary if client and documents exist', async () => {
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
				name: 'ID Doc 1',
				contentKey: new UniqueEntityId('doc-1'),
				version: 1,
				blobName: 'id1',
				thumbnailBlobName: 'id1-thumb',
				fileSize: 1000,
				folder: DocumentFolder.create('IDENTIFICATION'),
				uploadedBy: clientId,
				updatedAt: new Date('2023-01-01'),
				createdAt: new Date('2023-01-01'),
			}),
			Document.create({
				clientId,
				name: 'ID Doc 2',
				contentKey: new UniqueEntityId('doc-2'),
				version: 1,
				blobName: 'id2',
				thumbnailBlobName: 'id2-thumb',
				fileSize: 2000,
				folder: DocumentFolder.create('IDENTIFICATION'),
				uploadedBy: clientId,
				updatedAt: new Date('2023-01-01'),
				createdAt: new Date('2023-01-01'),
			}),
			Document.create({
				clientId,
				name: 'Correspondent Doc',
				contentKey: new UniqueEntityId('doc-3'),
				version: 1,
				blobName: 'cor1',
				thumbnailBlobName: 'cor1-thumb',
				fileSize: 1500,
				folder: DocumentFolder.create('INSPECTION_REPORTS'),
				uploadedBy: clientId,
				updatedAt: new Date('2023-02-01'),
				createdAt: new Date('2023-02-01'),
			}),
		)

		const result = await sut.execute({ clientId: clientId.toString() })
		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			// The summary should match the expected folder grouping
			expect(result.value).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						folderName: 'IDENTIFICATION',
						fileCount: 2,
						totalFileSizeSum: 3000,
						mostRecentUpdatedDate: new Date('2023-01-01'),
					}),
					expect.objectContaining({
						folderName: 'INSPECTION_REPORTS',
						fileCount: 1,
						totalFileSizeSum: 1500,
						mostRecentUpdatedDate: new Date('2023-02-01'),
					}),
				]),
			)
		}
	})
})
