import { makeClient } from 'test/factories/make-client'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { GetClientProfilePhotoUseCase } from './get-client-profile-photo'
import { ClientNotFoundError } from './errors/client-not-found-error'

let inMemoryClientsRepository: InMemoryClientsRepository
let sut: GetClientProfilePhotoUseCase

describe('Get Client Profile Photo', () => {
	beforeEach(() => {
		inMemoryClientsRepository = new InMemoryClientsRepository()
		sut = new GetClientProfilePhotoUseCase(inMemoryClientsRepository)
	})

	it('should be able to get a profile photo for a client', async () => {
		const profilePhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...'
		const client = makeClient({ profilePhoto })
		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({
			clientId: client.id.toString(),
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.profilePhoto).toBe(profilePhoto)
		}
	})

	it('should return null when client has no profile photo', async () => {
		const client = makeClient()
		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({
			clientId: client.id.toString(),
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.profilePhoto).toBeNull()
		}
	})

	it('should not be able to get profile photo for nonexistent client', async () => {
		const result = await sut.execute({
			clientId: 'non-existent-client-id',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ClientNotFoundError)
	})
})
