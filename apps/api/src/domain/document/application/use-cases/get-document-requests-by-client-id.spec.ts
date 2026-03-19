import { InMemoryDocumentRequestRepository } from 'test/repositories/prisma/in-memory-document-request-repository'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { GetDocumentRequestsByClientIdUseCase } from './get-document-requests-by-client-id'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DocumentRequest } from '../../enterprise/entities/document-request'
import { DocumentRequestType } from '../../enterprise/entities/value-objects/document-request-type'
import { DocumentRequestStatus } from '../../enterprise/entities/value-objects/document-request-status'
import { Client } from '@/domain/financial-management/enterprise/entities/client'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'

describe('GetDocumentRequestsByClientIdUseCase', () => {
	let documentRequestRepository: InMemoryDocumentRequestRepository
	let clientsRepository: InMemoryClientsRepository
	let sut: GetDocumentRequestsByClientIdUseCase

	beforeEach(() => {
		documentRequestRepository = new InMemoryDocumentRequestRepository()
		clientsRepository = new InMemoryClientsRepository()
		sut = new GetDocumentRequestsByClientIdUseCase(
			documentRequestRepository,
			clientsRepository,
		)
	})

	it('should return all document requests for a client', async () => {
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

		const docReq1 = DocumentRequest.create({
			clientId,
			requestedBy: new UniqueEntityId(),
			requestType: DocumentRequestType.create('PROOF_OF_ADDRESS'),
			status: DocumentRequestStatus.create('PENDING'),
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		const docReq2 = DocumentRequest.create({
			clientId,
			requestedBy: new UniqueEntityId(),
			requestType: DocumentRequestType.create('PROOF_OF_IDENTITY'),
			status: DocumentRequestStatus.create('UPLOADED'),
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		await documentRequestRepository.create(docReq1)
		await documentRequestRepository.create(docReq2)

		const result = await sut.execute({ clientId: clientId.toString() })

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.documentRequestsByClientId.length).toBe(2)
		}
	})

	it('should filter document requests by requestType', async () => {
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

		const docReq1 = DocumentRequest.create({
			clientId,
			requestedBy: new UniqueEntityId(),
			requestType: DocumentRequestType.create('PROOF_OF_ADDRESS'),
			status: DocumentRequestStatus.create('PENDING'),
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		const docReq2 = DocumentRequest.create({
			clientId,
			requestedBy: new UniqueEntityId(),
			requestType: DocumentRequestType.create('PROOF_OF_IDENTITY'),
			status: DocumentRequestStatus.create('COMPLETED'),
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		await documentRequestRepository.create(docReq1)
		await documentRequestRepository.create(docReq2)

		const result = await sut.execute({
			clientId: clientId.toString(),
			requestType: 'PROOF_OF_ADDRESS',
		})

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.documentRequestsByClientId[0].requestType.value).toBe(
				'PROOF_OF_ADDRESS',
			)
		}
	})

	it('should return ClientNotFoundError if client does not exist', async () => {
		const nonExistentClientId = new UniqueEntityId().toString()

		const result = await sut.execute({ clientId: nonExistentClientId })

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(ClientNotFoundError)
	})
})
