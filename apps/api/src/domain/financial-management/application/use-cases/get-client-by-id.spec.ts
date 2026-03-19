import { GetClientByIdUseCase } from './get-client-by-id'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { makeClient } from 'test/factories/make-client'
import { ClientNotFoundError } from './errors/client-not-found-error'

describe('GetClientByIdUseCase', () => {
	let inMemoryClientsRepository: InMemoryClientsRepository
	let sut: GetClientByIdUseCase

	beforeEach(() => {
		inMemoryClientsRepository = new InMemoryClientsRepository()
		sut = new GetClientByIdUseCase(inMemoryClientsRepository)
	})

	it('should return client by id', async () => {
		const client = makeClient()
		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({ clientId: client.id.toString() })

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.client.id).toEqual(client.id)
		}
	})

	it('should return error if client not found', async () => {
		const result = await sut.execute({ clientId: 'non-existent-id' })

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(ClientNotFoundError)
	})
})
