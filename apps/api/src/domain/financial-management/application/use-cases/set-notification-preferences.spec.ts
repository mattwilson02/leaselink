import { makeClient } from 'test/factories/make-client'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { SetNotificationPreferencesUseCase } from './set-notification-preferences'
import { ClientNotFoundError } from './errors/client-not-found-error'

let inMemoryClientsRepository: InMemoryClientsRepository
let sut: SetNotificationPreferencesUseCase

describe('Set Notification Preferences', () => {
	beforeEach(() => {
		inMemoryClientsRepository = new InMemoryClientsRepository()
		sut = new SetNotificationPreferencesUseCase(inMemoryClientsRepository)
	})

	it('should be able to set all notification preferences', async () => {
		const client = makeClient()
		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({
			clientId: client.id.toString(),
			receivesEmailNotifications: true,
			receivesPushNotifications: true,
			receivesNotificationsForPortfolio: true,
			receivesNotificationsForDocuments: true,
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryClientsRepository.items[0].receivesEmailNotifications).toBe(
			true,
		)
		expect(inMemoryClientsRepository.items[0].receivesPushNotifications).toBe(
			true,
		)
		expect(
			inMemoryClientsRepository.items[0].receivesNotificationsForPortfolio,
		).toBe(true)
		expect(
			inMemoryClientsRepository.items[0].receivesNotificationsForDocuments,
		).toBe(true)
		expect(result.value).toEqual({
			client: inMemoryClientsRepository.items[0],
		})
	})

	it('should be able to set individual notification preferences', async () => {
		const client = makeClient()
		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({
			clientId: client.id.toString(),
			receivesEmailNotifications: true,
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryClientsRepository.items[0].receivesEmailNotifications).toBe(
			true,
		)
		expect(inMemoryClientsRepository.items[0].receivesPushNotifications).toBe(
			false,
		)
	})

	it('should be able to disable notification preferences', async () => {
		const client = makeClient({
			receivesEmailNotifications: true,
			receivesPushNotifications: true,
			receivesNotificationsForPortfolio: true,
			receivesNotificationsForDocuments: true,
		})
		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({
			clientId: client.id.toString(),
			receivesEmailNotifications: false,
			receivesPushNotifications: false,
			receivesNotificationsForPortfolio: false,
			receivesNotificationsForDocuments: false,
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryClientsRepository.items[0].receivesEmailNotifications).toBe(
			false,
		)
		expect(inMemoryClientsRepository.items[0].receivesPushNotifications).toBe(
			false,
		)
		expect(
			inMemoryClientsRepository.items[0].receivesNotificationsForPortfolio,
		).toBe(false)
		expect(
			inMemoryClientsRepository.items[0].receivesNotificationsForDocuments,
		).toBe(false)
	})

	it('should not be able to set notification preferences for nonexistent client', async () => {
		const result = await sut.execute({
			clientId: 'non-existent-client-id',
			receivesEmailNotifications: true,
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ClientNotFoundError)
	})

	it('should not change preferences when none are provided', async () => {
		const client = makeClient({
			receivesEmailNotifications: true,
			receivesPushNotifications: false,
			receivesNotificationsForPortfolio: true,
			receivesNotificationsForDocuments: false,
		})
		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({
			clientId: client.id.toString(),
		})

		expect(result.isRight()).toBeTruthy()
		expect(inMemoryClientsRepository.items[0].receivesEmailNotifications).toBe(
			true,
		)
		expect(inMemoryClientsRepository.items[0].receivesPushNotifications).toBe(
			false,
		)
		expect(
			inMemoryClientsRepository.items[0].receivesNotificationsForPortfolio,
		).toBe(true)
		expect(
			inMemoryClientsRepository.items[0].receivesNotificationsForDocuments,
		).toBe(false)
	})
})
