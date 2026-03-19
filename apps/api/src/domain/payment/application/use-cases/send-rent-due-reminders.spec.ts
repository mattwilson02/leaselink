import { InMemoryPaymentsRepository } from 'test/repositories/prisma/in-memory-payments-repository'
import { InMemoryNotificationsRepository } from 'test/repositories/prisma/in-memory-notifications-repository'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { InMemoryPushNotificationsRepository } from 'test/repositories/expo-push-notifications/in-memory-push-notifications-repository'
import { makePayment } from 'test/factories/make-payment'
import { PaymentStatus } from '@/domain/payment/enterprise/entities/value-objects/payment-status'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import { SendRentDueRemindersUseCase } from './send-rent-due-reminders'
import { ActionType } from '@/domain/notification/enterprise/entities/notification'

let inMemoryPaymentsRepository: InMemoryPaymentsRepository
let inMemoryNotificationsRepository: InMemoryNotificationsRepository
let inMemoryClientsRepository: InMemoryClientsRepository
let inMemoryPushRepository: InMemoryPushNotificationsRepository
let createNotificationUseCase: CreateNotificationUseCase
let sut: SendRentDueRemindersUseCase

describe('SendRentDueRemindersUseCase', () => {
	beforeEach(() => {
		inMemoryPaymentsRepository = new InMemoryPaymentsRepository()
		inMemoryNotificationsRepository = new InMemoryNotificationsRepository()
		inMemoryClientsRepository = new InMemoryClientsRepository()
		inMemoryPushRepository = new InMemoryPushNotificationsRepository()
		createNotificationUseCase = new CreateNotificationUseCase(
			inMemoryNotificationsRepository,
			inMemoryClientsRepository,
			inMemoryPushRepository,
		)
		sut = new SendRentDueRemindersUseCase(
			inMemoryPaymentsRepository,
			inMemoryNotificationsRepository,
			createNotificationUseCase,
		)
	})

	it('should send reminder for payment due in 1 day', async () => {
		const tenantId = new UniqueEntityId('tenant-1')
		const dueDate = new Date()
		dueDate.setDate(dueDate.getDate() + 1)

		const payment = makePayment({
			tenantId,
			dueDate,
			status: PaymentStatus.create('PENDING'),
		})
		await inMemoryPaymentsRepository.create(payment)

		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.remindersSent).toBe(1)
		}
		expect(inMemoryNotificationsRepository.items).toHaveLength(1)
		expect(inMemoryNotificationsRepository.items[0].actionType).toBe(
			ActionType.RENT_REMINDER,
		)
	})

	it('should not send reminder for payment due in 5 days', async () => {
		const tenantId = new UniqueEntityId('tenant-2')
		const dueDate = new Date()
		dueDate.setDate(dueDate.getDate() + 5)

		const payment = makePayment({
			tenantId,
			dueDate,
			status: PaymentStatus.create('PENDING'),
		})
		await inMemoryPaymentsRepository.create(payment)

		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.remindersSent).toBe(0)
		}
	})

	it('should not send reminder for PAID payment due tomorrow', async () => {
		const tenantId = new UniqueEntityId('tenant-3')
		const dueDate = new Date()
		dueDate.setDate(dueDate.getDate() + 1)

		const payment = makePayment({
			tenantId,
			dueDate,
			status: PaymentStatus.create('PAID'),
		})
		await inMemoryPaymentsRepository.create(payment)

		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.remindersSent).toBe(0)
		}
	})

	it('should not duplicate reminders sent the same day', async () => {
		const tenantId = new UniqueEntityId('tenant-4')
		const dueDate = new Date()
		dueDate.setDate(dueDate.getDate() + 1)

		const payment = makePayment({
			tenantId,
			dueDate,
			status: PaymentStatus.create('PENDING'),
		})
		await inMemoryPaymentsRepository.create(payment)

		// First run
		await sut.execute()
		// Second run same day — should deduplicate
		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.remindersSent).toBe(0)
		}
		expect(inMemoryNotificationsRepository.items).toHaveLength(1)
	})

	it('should handle no pending payments gracefully', async () => {
		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.remindersSent).toBe(0)
		}
	})
})
