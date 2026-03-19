import { InMemoryNotificationsRepository } from 'test/repositories/prisma/in-memory-notifications-repository'
import {
	Notification,
	ActionType,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { InMemoryPushNotificationsRepository } from 'test/repositories/expo-push-notifications/in-memory-push-notifications-repository'
import { CreateNotificationUseCase } from './create-notification'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { Client } from '@/domain/financial-management/enterprise/entities/client'

let inMemoryNotificationsRepository: InMemoryNotificationsRepository
let inMemoryPushNotificationsRepository: InMemoryPushNotificationsRepository
let inMemoryClientsRepository: InMemoryClientsRepository
let sut: CreateNotificationUseCase

describe('UpdateNotificationUseCase', () => {
	beforeEach(() => {
		inMemoryNotificationsRepository = new InMemoryNotificationsRepository()
		inMemoryPushNotificationsRepository =
			new InMemoryPushNotificationsRepository()
		inMemoryClientsRepository = new InMemoryClientsRepository()
		sut = new CreateNotificationUseCase(
			inMemoryNotificationsRepository,
			inMemoryClientsRepository,
			inMemoryPushNotificationsRepository,
		)
	})

	it('should create a notification and send a push notification', async () => {
		const client = Client.create({
			email: 'test@email.com',
			phoneNumber: '+1234567890',
			name: 'Test Client',
			pushToken: 'ExponentPushToken[1234567890]',
			deviceId: new UniqueEntityId('device-1'),
		})

		inMemoryClientsRepository.items.push(client)

		const notification = Notification.create({
			personId: client.id,
			text: 'Test notification',
			notificationType: NotificationType.INFO,
			isRead: false,
			isActionComplete: false,
			actionType: ActionType.BASIC_COMPLETE,
			createdAt: new Date(),
		})
		inMemoryNotificationsRepository.items.push(notification)

		const result = await sut.execute({
			personId: client.id.toString(),
			text: 'Test notification',
			notificationType: NotificationType.INFO,
			actionType: ActionType.BASIC_COMPLETE,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			const { notification } = result.value
			expect(notification.text).toBe('Test notification')
			expect(notification.notificationType).toBe(NotificationType.INFO)

			expect(notification.isRead).toBe(false)
			expect(notification.isActionComplete).toBe(false)
			expect(notification.actionType).toBe(ActionType.BASIC_COMPLETE)
			expect(notification.createdAt).toBeInstanceOf(Date)
			expect(notification.personId.toString()).toBe(client.id.toString())

			expect(inMemoryNotificationsRepository.items).toContain(notification)
			expect(inMemoryPushNotificationsRepository.items).toHaveLength(1)
		}
	})

	it('should not send a push notification if the client does not have a push token', async () => {
		const client = Client.create({
			email: 'test@email.com',
			phoneNumber: '+1234567890',
			name: 'Test Client',
			deviceId: new UniqueEntityId('device-1'),
		})

		inMemoryClientsRepository.items.push(client)

		const notification = Notification.create({
			personId: client.id,
			text: 'Test notification',
			notificationType: NotificationType.INFO,
			isRead: false,
			isActionComplete: false,
			actionType: ActionType.BASIC_COMPLETE,
			createdAt: new Date(),
		})
		inMemoryNotificationsRepository.items.push(notification)

		const result = await sut.execute({
			personId: client.id.toString(),
			text: 'Test notification',
			notificationType: NotificationType.INFO,
			actionType: ActionType.BASIC_COMPLETE,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			const { notification } = result.value
			expect(notification.text).toBe('Test notification')
			expect(notification.notificationType).toBe(NotificationType.INFO)

			expect(notification.isRead).toBe(false)
			expect(notification.isActionComplete).toBe(false)
			expect(notification.actionType).toBe(ActionType.BASIC_COMPLETE)
			expect(notification.createdAt).toBeInstanceOf(Date)
			expect(notification.personId.toString()).toBe(client.id.toString())

			expect(inMemoryNotificationsRepository.items).toContain(notification)
			expect(inMemoryPushNotificationsRepository.items).toHaveLength(0)
		}
	})
})
