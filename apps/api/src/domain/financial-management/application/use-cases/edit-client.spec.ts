import { makeClient } from 'test/factories/make-client'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { EditClientUseCase } from './edit-client'
import { ClientNotFoundError } from './errors/client-not-found-error'
import { InvalidClientOnboardingStatusError } from './errors/invalid-client-onbooarding-status-error'
import { InvalidClientStatusError } from './errors/invalid-client-status-error'

let inMemoryClientsRepository: InMemoryClientsRepository
let sut: EditClientUseCase

describe('Edit Client', () => {
	beforeEach(() => {
		inMemoryClientsRepository = new InMemoryClientsRepository()
		sut = new EditClientUseCase(inMemoryClientsRepository)
	})

	it('should be able to edit client status', async () => {
		const client = makeClient()

		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({
			id: client.id.toString(),
			status: 'INACTIVE',
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryClientsRepository.items[0].status).toBe('INACTIVE')
		expect(result.value).toEqual({
			client: inMemoryClientsRepository.items[0],
		})
	})

	it('should not be able to edit status of nonexistent client', async () => {
		const result = await sut.execute({
			id: 'non-existent-client-id',
			status: 'INACTIVE',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ClientNotFoundError)
	})

	it('should not be able to edit client with invalid status', async () => {
		const client = makeClient()
		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({
			id: client.id.toString(),
			status: 'INVALID_STATUS',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(InvalidClientStatusError)
	})

	it('should not be able to edit client with same status', async () => {
		const client = makeClient()
		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({
			id: client.id.toString(),
			status: client.status,
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryClientsRepository.items[0].status).toBe(client.status)
		expect(result.value).toEqual({
			client: inMemoryClientsRepository.items[0],
		})
	})

	it('should be able to edit client onboarding status', async () => {
		const client = makeClient()

		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({
			id: client.id.toString(),
			onboardingStatus: 'ONBOARDED',
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryClientsRepository.items[0].onboardingStatus).toBe(
			'ONBOARDED',
		)
		expect(result.value).toEqual({
			client: inMemoryClientsRepository.items[0],
		})
	})

	it('should be able to edit client deviceId', async () => {
		const client = makeClient()

		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({
			id: client.id.toString(),
			deviceId: 'new-device-id',
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryClientsRepository.items[0].deviceId?.toString()).toBe(
			'new-device-id',
		)

		expect(result.value).toEqual({
			client: inMemoryClientsRepository.items[0],
		})
	})

	it('should not be able to edit onboarding status of nonexistent client', async () => {
		const result = await sut.execute({
			id: 'non-existent-client-id',
			onboardingStatus: 'ONBOARDED',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ClientNotFoundError)
	})

	it('should not be able to edit client with invalid onboarding status', async () => {
		const client = makeClient()
		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({
			id: client.id.toString(),
			onboardingStatus: 'INVALID_STATUS',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(InvalidClientOnboardingStatusError)
	})

	it('should not be able to edit client with same onboarding status', async () => {
		const client = makeClient()
		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({
			id: client.id.toString(),
			onboardingStatus: client.onboardingStatus,
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryClientsRepository.items[0].onboardingStatus).toBe(
			client.onboardingStatus,
		)
		expect(result.value).toEqual({
			client: inMemoryClientsRepository.items[0],
		})
	})

	it('should be able to edit client push token', async () => {
		const client = makeClient()

		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({
			id: client.id.toString(),
			pushToken: 'new-push-token',
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryClientsRepository.items[0].pushToken).toBe('new-push-token')
		expect(result.value).toEqual({
			client: inMemoryClientsRepository.items[0],
		})
	})
})
