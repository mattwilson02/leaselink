import { InMemoryNotificationsRepository } from 'test/repositories/prisma/in-memory-notifications-repository'
import { UpdateNotificationUseCase } from './update-notification'
import {
	Notification,
	ActionType,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { NotificationNotFoundError } from './errors/notification-not-found-error'
import { NotificationActionIncompleteError } from './errors/notification-action-incomplete-error'

let inMemoryNotificationsRepository: InMemoryNotificationsRepository
let sut: UpdateNotificationUseCase

describe('UpdateNotificationUseCase', () => {
	beforeEach(() => {
		inMemoryNotificationsRepository = new InMemoryNotificationsRepository()
		sut = new UpdateNotificationUseCase(inMemoryNotificationsRepository)
	})

	it('should update properties to true', async () => {
		const notification = Notification.create({
			personId: new UniqueEntityId('person-1'),
			text: 'Test notification',
			notificationType: NotificationType.INFO,
			isRead: false,
			isActionComplete: false,
			actionType: ActionType.BASIC_COMPLETE,
			createdAt: new Date(),
		})
		inMemoryNotificationsRepository.items.push(notification)

		const result = await sut.execute({
			notificationId: notification.id.toString(),
			isRead: true,
			isArchived: true,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.notification.isRead).toBe(true)
			expect(result.value.notification.archivedAt).not.toBeNull()
		}
	})

	it('should update properties to false', async () => {
		const notification = Notification.create({
			personId: new UniqueEntityId('person-1'),
			text: 'Test notification',
			notificationType: NotificationType.INFO,
			isRead: true,
			archivedAt: new Date(),
			isActionComplete: false,
			actionType: ActionType.BASIC_COMPLETE,
			createdAt: new Date(),
		})
		inMemoryNotificationsRepository.items.push(notification)

		const result = await sut.execute({
			notificationId: notification.id.toString(),
			isRead: false,
			isArchived: false,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.notification.isRead).toBe(false)
			expect(result.value.notification.archivedAt).toBeNull()
		}
	})

	it('should update isActionComplete if actionType is BASIC_COMPLETE', async () => {
		const notification = Notification.create({
			personId: new UniqueEntityId('person-1'),
			text: 'Test notification',
			notificationType: NotificationType.INFO,
			isRead: true,
			isActionComplete: true,
			actionType: ActionType.BASIC_COMPLETE,
			createdAt: new Date(),
		})
		inMemoryNotificationsRepository.items.push(notification)

		const result = await sut.execute({
			notificationId: notification.id.toString(),
			isRead: false,
			isArchived: false,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.notification.isRead).toBe(false)
			expect(result.value.notification.archivedAt).toBeNull()
		}
	})

	it('should not update isArchived if action is not complete on a notification', async () => {
		const notification = Notification.create({
			personId: new UniqueEntityId('person-1'),
			text: 'Test notification',
			notificationType: NotificationType.ACTION,
			isRead: false,
			isActionComplete: false,
			actionType: ActionType.BASIC_COMPLETE,
			createdAt: new Date(),
		})
		inMemoryNotificationsRepository.items.push(notification)

		const result = await sut.execute({
			notificationId: notification.id.toString(),
			isArchived: true,
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(NotificationActionIncompleteError)
	})

	it('should update isActionComplete if actionType is BASIC_COMPLETE', async () => {
		const notification = Notification.create({
			personId: new UniqueEntityId('person-1'),
			text: 'Test notification',
			notificationType: NotificationType.ACTION,
			isRead: false,
			isActionComplete: false,
			actionType: ActionType.BASIC_COMPLETE,
			createdAt: new Date(),
		})
		inMemoryNotificationsRepository.items.push(notification)

		const result = await sut.execute({
			notificationId: notification.id.toString(),
			isActionComplete: true,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.notification.isActionComplete).toBe(true)
		}
	})

	it('should not update isActionComplete if actionType is not BASIC_COMPLETE', async () => {
		const notification = Notification.create({
			personId: new UniqueEntityId('person-1'),
			text: 'Test notification',
			notificationType: NotificationType.ACTION,
			isRead: false,
			isActionComplete: false,
			actionType: ActionType.SIGN_DOCUMENT,
			createdAt: new Date(),
		})
		inMemoryNotificationsRepository.items.push(notification)

		const result = await sut.execute({
			notificationId: notification.id.toString(),
			isActionComplete: true,
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(Error)
	})

	it('should return left(NotificationNotFoundError) if notification does not exist', async () => {
		const result = await sut.execute({
			notificationId: 'non-existent-id',
			isRead: true,
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(NotificationNotFoundError)
	})

	it('should update both isRead and isActionComplete if both are provided and actionType is BASIC_COMPLETE', async () => {
		const notification = Notification.create({
			personId: new UniqueEntityId('person-1'),
			text: 'Test notification',
			notificationType: NotificationType.ACTION,
			isRead: false,
			isActionComplete: false,
			actionType: ActionType.BASIC_COMPLETE,
			createdAt: new Date(),
		})
		inMemoryNotificationsRepository.items.push(notification)

		const result = await sut.execute({
			notificationId: notification.id.toString(),
			isRead: true,
			isActionComplete: true,
		})

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.notification.isRead).toBe(true)
			expect(result.value.notification.isActionComplete).toBe(true)
		}
	})
})
