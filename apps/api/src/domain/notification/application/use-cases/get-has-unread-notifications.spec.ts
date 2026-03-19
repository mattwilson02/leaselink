import { InMemoryNotificationsRepository } from 'test/repositories/prisma/in-memory-notifications-repository'
import { GetHasUnreadNotificationsUseCase } from './get-has-unread-notifications'
import {
	Notification,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

let inMemoryNotificationsRepository: InMemoryNotificationsRepository
let sut: GetHasUnreadNotificationsUseCase

describe('Get has unread notifications', () => {
	beforeEach(() => {
		inMemoryNotificationsRepository = new InMemoryNotificationsRepository()
		sut = new GetHasUnreadNotificationsUseCase(inMemoryNotificationsRepository)
	})

	it('should return true if there are unread notifications for a valid person ID', async () => {
		const personId = new UniqueEntityId('person-1')

		inMemoryNotificationsRepository.items.push(
			Notification.create({
				personId,
				text: 'Unread Notification 1',
				notificationType: NotificationType.INFO,
				isRead: false,
				isActionComplete: false,
				createdAt: new Date(),
			}),
			Notification.create({
				personId,
				text: 'Read Notification 2',
				notificationType: NotificationType.INFO,
				isRead: true,
				isActionComplete: false,
				createdAt: new Date(),
			}),
		)

		const result = await sut.execute({ personId: personId.toString() })

		expect(result.isRight()).toBeTruthy()
		expect(result.value).toEqual({
			hasUnreadNotifications: true,
		})
	})

	it('should return false if there are no unread notifications for a valid person ID', async () => {
		const personId = new UniqueEntityId('person-2')

		inMemoryNotificationsRepository.items.push(
			Notification.create({
				personId,
				text: 'Read Notification 1',
				notificationType: NotificationType.INFO,
				isRead: true,
				isActionComplete: false,
				createdAt: new Date(),
			}),
		)

		const result = await sut.execute({ personId: personId.toString() })

		expect(result.isRight()).toBeTruthy()
		expect(result.value).toEqual({
			hasUnreadNotifications: false,
		})
	})
})
