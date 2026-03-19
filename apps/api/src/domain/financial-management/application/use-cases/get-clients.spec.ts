import { GetClientsUseCase } from './get-clients'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { makeClient } from 'test/factories/make-client'
import { ClientStatus } from '../../enterprise/entities/value-objects/client-status'

describe('GetClientsUseCase', () => {
	let inMemoryClientsRepository: InMemoryClientsRepository
	let sut: GetClientsUseCase

	beforeEach(() => {
		inMemoryClientsRepository = new InMemoryClientsRepository()
		sut = new GetClientsUseCase(inMemoryClientsRepository)
	})

	it('should list all clients', async () => {
		inMemoryClientsRepository.items.push(
			makeClient(),
			makeClient(),
			makeClient(),
		)

		const result = await sut.execute({ page: 1, pageSize: 20 })

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.clients).toHaveLength(3)
			expect(result.value.totalCount).toBe(3)
		}
	})

	it('should filter by status', async () => {
		inMemoryClientsRepository.items.push(
			makeClient({ status: ClientStatus.create('ACTIVE') }),
			makeClient({ status: ClientStatus.create('INVITED') }),
			makeClient({ status: ClientStatus.create('ACTIVE') }),
		)

		const result = await sut.execute({
			status: 'ACTIVE',
			page: 1,
			pageSize: 20,
		})

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.clients).toHaveLength(2)
			expect(result.value.totalCount).toBe(2)
		}
	})

	it('should search by name', async () => {
		inMemoryClientsRepository.items.push(
			makeClient({ name: 'John Doe' }),
			makeClient({ name: 'Jane Smith' }),
			makeClient({ name: 'Alice Johnson' }),
		)

		const result = await sut.execute({ search: 'john', page: 1, pageSize: 20 })

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.clients).toHaveLength(2)
		}
	})

	it('should search by email', async () => {
		inMemoryClientsRepository.items.push(
			makeClient({ email: 'john@example.com' }),
			makeClient({ email: 'jane@test.com' }),
			makeClient({ email: 'alice@example.com' }),
		)

		const result = await sut.execute({
			search: 'example',
			page: 1,
			pageSize: 20,
		})

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.clients).toHaveLength(2)
		}
	})

	it('should paginate results', async () => {
		for (let i = 0; i < 5; i++) {
			inMemoryClientsRepository.items.push(makeClient())
		}

		const result = await sut.execute({ page: 1, pageSize: 2 })

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.clients).toHaveLength(2)
			expect(result.value.totalCount).toBe(5)
		}
	})
})
