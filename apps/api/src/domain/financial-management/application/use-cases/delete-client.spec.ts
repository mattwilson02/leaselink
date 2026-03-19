import { left } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { AuthError } from '@/domain/authentication/application/use-cases/errors/auth-error'
import { makeClient } from 'test/factories/make-client'
import { makeIdentityProvider } from 'test/factories/make-identity-provider'
import { makeUserAuth } from 'test/factories/make-user-auth'
import { InMemoryIdentityProvidersRepository } from 'test/repositories/better-auth/in-memory-identity-provider-repository'
import { InMemoryUsersAuthRepository } from 'test/repositories/better-auth/in-memory-users-auth-repository'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { DeleteClientUseCase } from './delete-client'

let inMemoryClientsRepository: InMemoryClientsRepository
let inMemoryUsersAuthRepository: InMemoryUsersAuthRepository
let inMemoryIdentityProvidersRepository: InMemoryIdentityProvidersRepository
let sut: DeleteClientUseCase

describe('Delete client', () => {
	beforeEach(() => {
		inMemoryClientsRepository = new InMemoryClientsRepository()
		inMemoryUsersAuthRepository = new InMemoryUsersAuthRepository()
		inMemoryIdentityProvidersRepository =
			new InMemoryIdentityProvidersRepository()

		sut = new DeleteClientUseCase(
			inMemoryClientsRepository,
			inMemoryIdentityProvidersRepository,
			inMemoryUsersAuthRepository,
		)
	})

	it('should delete a client and its associated records', async () => {
		const client = makeClient()
		await inMemoryClientsRepository.create(client)
		const clientId = client.id.toString()

		const userAuth = makeUserAuth()
		await inMemoryUsersAuthRepository.create(userAuth)
		const userAuthId = userAuth.id.toString()

		const identityProvider = makeIdentityProvider({
			clientId: client.id,
			providerUserId: userAuthId,
		})
		await inMemoryIdentityProvidersRepository.create(identityProvider)

		const result = await sut.execute({ clientId })

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryClientsRepository.items).toHaveLength(0)
		expect(inMemoryUsersAuthRepository.items).toHaveLength(0)
		expect(inMemoryIdentityProvidersRepository.items).toHaveLength(0)
	})

	it('should return an error when client is not found', async () => {
		const result = await sut.execute({ clientId: 'non-existent-id' })

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ResourceNotFoundError)
	})

	it('should return an error when identity provider is not found', async () => {
		const client = makeClient()
		await inMemoryClientsRepository.create(client)
		const clientId = client.id.toString()

		const result = await sut.execute({ clientId })

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ResourceNotFoundError)

		expect(inMemoryClientsRepository.items).toHaveLength(1)
	})

	it('should properly clean up all associated resources', async () => {
		const client = makeClient()
		await inMemoryClientsRepository.create(client)
		const clientId = client.id.toString()

		const userAuth1 = makeUserAuth()
		const userAuth2 = makeUserAuth()
		await inMemoryUsersAuthRepository.create(userAuth1)
		await inMemoryUsersAuthRepository.create(userAuth2)
		const userAuthId = userAuth1.id.toString()

		const identityProvider = makeIdentityProvider({
			clientId: client.id,
			providerUserId: userAuthId,
		})
		await inMemoryIdentityProvidersRepository.create(identityProvider)

		await sut.execute({ clientId })

		expect(inMemoryUsersAuthRepository.items).toHaveLength(1)
		expect(inMemoryUsersAuthRepository.items[0].id.toString()).toEqual(
			userAuth2.id.toString(),
		)
	})

	it('should return an error when user auth deletion fails', async () => {
		const client = makeClient()
		await inMemoryClientsRepository.create(client)
		const clientId = client.id.toString()

		const userAuth = makeUserAuth()
		await inMemoryUsersAuthRepository.create(userAuth)
		const userAuthId = userAuth.id.toString()

		const identityProvider = makeIdentityProvider({
			clientId: client.id,
			providerUserId: userAuthId,
		})
		await inMemoryIdentityProvidersRepository.create(identityProvider)

		const mockError = new AuthError({
			message: 'Failed to delete user auth',
			details: {},
			getOriginalError: () => new Error('Failed to delete user auth'),
		})

		vi.spyOn(inMemoryUsersAuthRepository, 'delete').mockImplementationOnce(
			() => {
				return Promise.resolve(left(mockError))
			},
		)

		const result = await sut.execute({ clientId })

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toEqual(mockError)

		expect(inMemoryClientsRepository.items).toHaveLength(1)
		expect(inMemoryIdentityProvidersRepository.items).toHaveLength(1)
		expect(inMemoryUsersAuthRepository.items).toHaveLength(1)
	})
})
