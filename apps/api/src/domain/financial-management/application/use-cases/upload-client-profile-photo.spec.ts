import { makeClient } from 'test/factories/make-client'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { UploadClientProfilePhotoUseCase } from './upload-client-profile-photo'
import { ClientNotFoundError } from './errors/client-not-found-error'

let inMemoryClientsRepository: InMemoryClientsRepository
let sut: UploadClientProfilePhotoUseCase

describe('Upload Client Profile Photo', () => {
	beforeEach(() => {
		inMemoryClientsRepository = new InMemoryClientsRepository()
		sut = new UploadClientProfilePhotoUseCase(inMemoryClientsRepository)
	})

	it('should be able to upload a profile photo for a client', async () => {
		const client = makeClient()
		inMemoryClientsRepository.items.push(client)

		const profilePhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...'

		const result = await sut.execute({
			clientId: client.id.toString(),
			profilePhoto,
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryClientsRepository.items[0].profilePhoto).toBe(profilePhoto)
		expect(result.value).toEqual({
			client: inMemoryClientsRepository.items[0],
		})
	})

	it('should be able to replace an existing profile photo', async () => {
		const client = makeClient({
			profilePhoto: 'data:image/png;base64,oldPhotoData...',
		})
		inMemoryClientsRepository.items.push(client)

		const newProfilePhoto = 'data:image/png;base64,newPhotoData...'

		const result = await sut.execute({
			clientId: client.id.toString(),
			profilePhoto: newProfilePhoto,
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryClientsRepository.items[0].profilePhoto).toBe(
			newProfilePhoto,
		)
	})

	it('should not be able to upload profile photo for nonexistent client', async () => {
		const result = await sut.execute({
			clientId: 'non-existent-client-id',
			profilePhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ClientNotFoundError)
	})
})
