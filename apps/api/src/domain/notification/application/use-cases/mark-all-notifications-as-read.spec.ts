import { MarkAllNotificationsAsReadUseCase } from './mark-all-notifications-as-read'
import { InMemoryNotificationsRepository } from 'test/repositories/prisma/in-memory-notifications-repository'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import {
	Notification,
	NotificationType,
	ActionType,
} from '../../enterprise/entities/notification'
import { makeClient } from 'test/factories/make-client'

describe('MarkAllNotificationsAsReadUseCase', () => {
	let inMemoryNotificationsRepository: InMemoryNotificationsRepository
	let inMemoryClientsRepository: InMemoryClientsRepository
	let sut: MarkAllNotificationsAsReadUseCase

	beforeEach(() => {
		inMemoryNotificationsRepository = new InMemoryNotificationsRepository()
		inMemoryClientsRepository = new InMemoryClientsRepository()
		sut = new MarkAllNotificationsAsReadUseCase(
			inMemoryNotificationsRepository,
			inMemoryClientsRepository,
		)
	})

	it('should throw ClientNotFoundError if client does not exist', async () => {
		const result = await sut.execute({ personId: 'non-existent-client' })
		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ClientNotFoundError)
	})

	it('should return count 0 if no unread notifications exist', async () => {
		const clientData = makeClient()
		await sut.execute({ personId: clientData.id.toString() })
		inMemoryClientsRepository.items.push(clientData)
		const notification = Notification.create({
			personId: clientData.id,
			text: 'Test notification',
			notificationType: NotificationType.INFO,
			isRead: true,
			isActionComplete: false,
			actionType: ActionType.BASIC_COMPLETE,
			createdAt: new Date(),
		})
		inMemoryNotificationsRepository.items.push(notification)
		const result = await sut.execute({ personId: clientData.id.toString() })
		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.count).toBe(0)
		}
	})

	it('should return count 0 if no notifications exist', async () => {
		const clientData = makeClient()
		await sut.execute({ personId: clientData.id.toString() })
		inMemoryClientsRepository.items.push(clientData)
		// No notifications added
		const result = await sut.execute({ personId: clientData.id.toString() })
		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.count).toBe(0)
		}
	})

	it('should return count > 0 if unread notifications are updated', async () => {
		const clientData = makeClient()
		await sut.execute({ personId: clientData.id.toString() })
		inMemoryClientsRepository.items.push(clientData)
		const notification = Notification.create({
			personId: clientData.id,
			text: 'Test notification',
			notificationType: NotificationType.INFO,
			isRead: false,
			isActionComplete: false,
			actionType: ActionType.BASIC_COMPLETE,
			createdAt: new Date(),
		})
		inMemoryNotificationsRepository.items.push(notification)
		const result = await sut.execute({ personId: clientData.id.toString() })
		expect(result.isRight()).toBeTruthy()
		if (result.isRight()) {
			expect(result.value.count).toBe(1)
		}
		// Ensure notification is now marked as read
		expect(notification.isRead).toBe(true)
	})
})
