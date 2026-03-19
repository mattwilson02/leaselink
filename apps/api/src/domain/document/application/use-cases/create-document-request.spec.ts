import { InMemoryDocumentRequestRepository } from 'test/repositories/prisma/in-memory-document-request-repository'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository' // <-- import this!
import { CreateDocumentRequestUseCase } from '@/domain/document/application/use-cases/create-document-request'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { CreateDocumentRequestError } from './errors/create-document-request-error'
import { Client } from '@/domain/financial-management/enterprise/entities/client'
import { ClientStatus } from '@/domain/financial-management/enterprise/entities/value-objects/client-status'

describe('CreateDocumentRequestUseCase', () => {
	let documentRequestRepository: InMemoryDocumentRequestRepository
	let clientsRepository: InMemoryClientsRepository
	let sut: CreateDocumentRequestUseCase

	beforeEach(() => {
		documentRequestRepository = new InMemoryDocumentRequestRepository()
		clientsRepository = new InMemoryClientsRepository()
		sut = new CreateDocumentRequestUseCase(
			documentRequestRepository,
			clientsRepository,
		)
	})

	it('creates a document request', async () => {
		const clientId = new UniqueEntityId().toString()
		const requestedBy = new UniqueEntityId().toString()
		const requestType = 'PROOF_OF_ADDRESS'

		const client = Client.create(
			{
				name: 'Test Client',
				email: 'test@example.com',
				phoneNumber: '+441234567890',
				status: ClientStatus.create('ACTIVE'),
			},
			new UniqueEntityId(clientId),
		)
		await clientsRepository.create(client)

		const result = await sut.execute({
			clientId,
			requestedBy,
			requestType,
		})

		expect(result.isRight()).toBe(true)
	})

	it('returns ClientNotFoundError if client is not found', async () => {
		const clientId = new UniqueEntityId().toString()
		const requestedBy = new UniqueEntityId().toString()
		const requestType = 'PROOF_OF_ADDRESS'

		const result = await sut.execute({
			clientId,
			requestedBy,
			requestType,
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(ClientNotFoundError)
	})

	it('returns CreateDocumentRequestError if creation fails', async () => {
		const clientId = new UniqueEntityId().toString()
		const requestedBy = new UniqueEntityId().toString()
		const requestType = 'PROOF_OF_ADDRESS'

		const client = Client.create(
			{
				name: 'Test Client',
				email: 'test@example.com',
				phoneNumber: '+441234567890',
				status: ClientStatus.create('ACTIVE'),
			},
			new UniqueEntityId(clientId),
		)
		await clientsRepository.create(client)

		documentRequestRepository.create = vi.fn(async () => null)

		const result = await sut.execute({
			clientId,
			requestedBy,
			requestType,
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(CreateDocumentRequestError)
	})
})
