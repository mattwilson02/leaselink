import { makeClient } from 'test/factories/make-client'
import { makeUserAuth } from 'test/factories/make-user-auth'
import { InMemoryIdentityProvidersRepository } from 'test/repositories/better-auth/in-memory-identity-provider-repository'
import { InMemoryUsersAuthRepository } from 'test/repositories/better-auth/in-memory-users-auth-repository'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { CreateClientUseCase } from './create-client'

let inMemoryClientsRepository: InMemoryClientsRepository
let inMemoryUsersAuthRepository: InMemoryUsersAuthRepository
let inMemoryIdentityProvidersRepository: InMemoryIdentityProvidersRepository
let sut: CreateClientUseCase

describe('Create client', () => {
	beforeEach(() => {
		inMemoryClientsRepository = new InMemoryClientsRepository()
		inMemoryUsersAuthRepository = new InMemoryUsersAuthRepository()
		inMemoryIdentityProvidersRepository =
			new InMemoryIdentityProvidersRepository()
		sut = new CreateClientUseCase(
			inMemoryClientsRepository,
			inMemoryUsersAuthRepository,
			inMemoryIdentityProvidersRepository,
		)
	})

	it('should create a client', async () => {
		const clientData = makeClient()
		const result = await sut.execute(clientData)

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryClientsRepository.items).toHaveLength(1)
		expect(inMemoryUsersAuthRepository.items).toHaveLength(1)
		expect(inMemoryIdentityProvidersRepository.items).toHaveLength(1)
		expect(inMemoryIdentityProvidersRepository.items[0].providerUserId).toEqual(
			inMemoryUsersAuthRepository.items[0].id.toString(),
		)
		expect(result.value).toEqual({
			client: inMemoryClientsRepository.items[0],
		})
		expect(result.value).toEqual({
			client: expect.objectContaining({
				// biome-ignore lint/style/useNamingConvention: <casing is just fine as is>
				_id: inMemoryIdentityProvidersRepository.items[0].clientId,
			}),
		})
	})

	it('should not create a client with same email', async () => {
		const clientData = makeClient()
		await sut.execute(clientData)
		const result = await sut.execute(clientData)
		expect(result.isRight()).toBeFalsy()
	})

	it('should not create a client if user auth creation fails', async () => {
		const newUserAuth = makeUserAuth()
		inMemoryUsersAuthRepository.items.push(newUserAuth)

		const clientData = makeClient({
			email: newUserAuth.email,
			phoneNumber: newUserAuth.phoneNumber,
		})

		const result = await sut.execute(clientData)
		expect(result.isRight()).toBeFalsy()
		expect(inMemoryClientsRepository.items).toHaveLength(0)
	})

	it('should not create a client if identity provider creation fails', async () => {
		const clientData = makeClient()
		inMemoryIdentityProvidersRepository.create = vi.fn(async () => null)

		const result = await sut.execute(clientData)
		expect(result.isRight()).toBeFalsy()
		expect(inMemoryClientsRepository.items).toHaveLength(0)
		expect(inMemoryUsersAuthRepository.items).toHaveLength(0)
	})
})
