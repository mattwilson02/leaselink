import { MarkAllNotificationsAsReadUseCase } from './mark-all-notifications-as-read'
import { InMemoryNotificationsRepository } from 'test/repositories/prisma/in-memory-notifications-repository'
import {
	Notification,
	NotificationType,
	ActionType,
} from '../../enterprise/entities/notification'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

describe('MarkAllNotificationsAsReadUseCase', () => {
	let inMemoryNotificationsRepository: InMemoryNotificationsRepository
	let sut: MarkAllNotificationsAsReadUseCase

	beforeEach(() => {
		inMemoryNotificationsRepository = new InMemoryNotificationsRepository()
		sut = new MarkAllNotificationsAsReadUseCase(
			inMemoryNotificationsRepository,
		)
	})

	it('should return count 0 if no unread notifications exist', async () => {
		const personId = new UniqueEntityId()
		const notification = Notification.create({
			personId,
			text: 'Test notification',
			notificationType: NotificationType.INFO,
			isRead: true,
			isActionComplete: false,
			actionType: ActionType.BASIC_COMPLETE,
			createdAt: new Date(),
		})
		inMemoryNotificationsRepository.items.push(notification)
		const result = await sut.execute({ personId: personId.toString() })
		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.count).toBe(0)
		}
	})

	it('should return count 0 if no notifications exist', async () => {
		const personId = new UniqueEntityId()
		const result = await sut.execute({ personId: personId.toString() })
		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.count).toBe(0)
		}
	})

	it('should return count > 0 if unread notifications are updated', async () => {
		const personId = new UniqueEntityId()
		const notification = Notification.create({
			personId,
			text: 'Test notification',
			notificationType: NotificationType.INFO,
			isRead: false,
			isActionComplete: false,
			actionType: ActionType.BASIC_COMPLETE,
			createdAt: new Date(),
		})
		inMemoryNotificationsRepository.items.push(notification)
		const result = await sut.execute({ personId: personId.toString() })
		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.count).toBe(1)
		}
		// Ensure notification is now marked as read
		expect(notification.isRead).toBe(true)
	})
})
