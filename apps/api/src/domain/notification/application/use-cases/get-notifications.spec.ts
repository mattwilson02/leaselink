import { InMemoryNotificationsRepository } from 'test/repositories/prisma/in-memory-notifications-repository'
import { GetNotificationsUseCase } from './get-notifications'
import {
	Notification,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

let inMemoryNotificationsRepository: InMemoryNotificationsRepository
let sut: GetNotificationsUseCase

describe('Get Notifications', () => {
	beforeEach(() => {
		inMemoryNotificationsRepository = new InMemoryNotificationsRepository()
		sut = new GetNotificationsUseCase(inMemoryNotificationsRepository)
	})

	it('should retrieve notifications for a valid person ID', async () => {
		const personId = new UniqueEntityId('person-1')

		inMemoryNotificationsRepository.items.push(
			Notification.create({
				personId,
				text: 'Notification 1',
				notificationType: NotificationType.INFO,
				isRead: false,
				isActionComplete: false,
				createdAt: new Date(),
			}),
			Notification.create({
				personId,
				text: 'Notification 2',
				notificationType: NotificationType.INFO,
				isRead: false,
				isActionComplete: false,
				createdAt: new Date(),
			}),
		)

		const result = await sut.execute({ personId: personId.toString() })

		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.notifications).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ text: 'Notification 1', personId }),
					expect.objectContaining({ text: 'Notification 2', personId }),
				]),
			)
			expect(result.value.totalCount).toBe(2)
		}
	})

	it('should return an empty array if no notifications are found for the person ID', async () => {
		const personId = 'non-existent-person'

		const result = await sut.execute({ personId })

		expect(result.isRight()).toBeTruthy()
		expect(result.value).toEqual({
			notifications: [],
			totalCount: 0,
		})
	})

	it('should respect offset and limit parameters', async () => {
		const personId = new UniqueEntityId('person-1')

		const dates = [
			new Date('2023-01-01T10:00:00.000Z'),
			new Date('2023-01-02T10:00:00.000Z'),
			new Date('2023-01-03T10:00:00.000Z'),
			new Date('2023-01-04T10:00:00.000Z'),
			new Date('2023-01-05T10:00:00.000Z'),
		]

		for (let i = 1; i <= 5; i++) {
			inMemoryNotificationsRepository.items.push(
				Notification.create({
					personId,
					text: `Notification ${i}`,
					notificationType: NotificationType.INFO,
					isRead: false,
					isActionComplete: false,
					createdAt: dates[i - 1],
				}),
			)
		}

		const result = await sut.execute({
			personId: personId.toString(),
			offset: 1,
			limit: 2,
		})

		if (result.isRight()) {
			expect(result.value.notifications).toHaveLength(2)

			expect(result.value.notifications).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ text: 'Notification 4' }),
					expect.objectContaining({ text: 'Notification 3' }),
				]),
			)
		} else {
			throw new Error('Expected result to be a success, but it was a failure.')
		}
	})

	it('should filter notifications by type', async () => {
		const personId = new UniqueEntityId('person-1')

		inMemoryNotificationsRepository.items.push(
			Notification.create({
				personId,
				text: 'Notification 1',
				notificationType: NotificationType.INFO,
				isRead: false,
				isActionComplete: false,
				createdAt: new Date(),
			}),
			Notification.create({
				personId,
				text: 'Notification 2',
				notificationType: NotificationType.ACTION,
				isRead: false,
				isActionComplete: false,
				createdAt: new Date(),
			}),
		)

		const result = await sut.execute({
			personId: personId.toString(),
			notificationType: NotificationType.INFO,
		})

		if (result.isRight()) {
			expect(result.value.notifications[0].notificationType).toBe(
				NotificationType.INFO,
			)
		} else {
			throw new Error('Expected result to be a success, but it was a failure.')
		}
	})

	it('should return notifications ordered by createdAt in descending order', async () => {
		const personId = new UniqueEntityId('person-1')
		// Create notifications with different timestamps
		const oldDate = new Date('2023-01-01T10:00:00.000Z')
		const middleDate = new Date('2023-01-02T10:00:00.000Z')
		const recentDate = new Date('2023-01-03T10:00:00.000Z')
		inMemoryNotificationsRepository.items.push(
			Notification.create({
				personId,
				text: 'Old Notification',
				notificationType: NotificationType.INFO,
				isRead: false,
				isActionComplete: false,
				createdAt: oldDate,
			}),
			Notification.create({
				personId,
				text: 'Recent Notification',
				notificationType: NotificationType.INFO,
				isRead: false,
				isActionComplete: false,
				createdAt: recentDate,
			}),
			Notification.create({
				personId,
				text: 'Middle Notification',
				notificationType: NotificationType.INFO,
				isRead: false,
				isActionComplete: false,
				createdAt: middleDate,
			}),
		)
		const result = await sut.execute({ personId: personId.toString() })
		if (result.isRight()) {
			const notifications = result.value.notifications
			expect(notifications).toHaveLength(3)
			expect(notifications[0].text).toBe('Recent Notification')
			expect(notifications[1].text).toBe('Middle Notification')
			expect(notifications[2].text).toBe('Old Notification')
			for (let i = 0; i < notifications.length - 1; i++) {
				expect(notifications[i].createdAt.getTime()).toBeGreaterThanOrEqual(
					notifications[i + 1].createdAt.getTime(),
				)
			}
		} else {
			throw new Error('Expected result to be a success, but it was a failure.')
		}
	})
})
