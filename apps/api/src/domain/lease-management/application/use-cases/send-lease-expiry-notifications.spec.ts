import { InMemoryLeasesRepository } from 'test/repositories/prisma/in-memory-leases-repository'
import { InMemoryNotificationsRepository } from 'test/repositories/prisma/in-memory-notifications-repository'
import { InMemoryPropertiesRepository } from 'test/repositories/prisma/in-memory-properties-repository'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { InMemoryPushNotificationsRepository } from 'test/repositories/expo-push-notifications/in-memory-push-notifications-repository'
import { makeLease } from 'test/factories/make-lease'
import { makeProperty } from 'test/factories/make-property'
import { LeaseStatus } from '@/domain/lease-management/enterprise/entities/value-objects/lease-status'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import { ActionType } from '@/domain/notification/enterprise/entities/notification'
import { SendLeaseExpiryNotificationsUseCase } from './send-lease-expiry-notifications'

let inMemoryLeasesRepository: InMemoryLeasesRepository
let inMemoryNotificationsRepository: InMemoryNotificationsRepository
let inMemoryPropertiesRepository: InMemoryPropertiesRepository
let inMemoryClientsRepository: InMemoryClientsRepository
let inMemoryPushRepository: InMemoryPushNotificationsRepository
let createNotificationUseCase: CreateNotificationUseCase
let sut: SendLeaseExpiryNotificationsUseCase

describe('SendLeaseExpiryNotificationsUseCase', () => {
	beforeEach(() => {
		inMemoryLeasesRepository = new InMemoryLeasesRepository()
		inMemoryNotificationsRepository = new InMemoryNotificationsRepository()
		inMemoryPropertiesRepository = new InMemoryPropertiesRepository()
		inMemoryClientsRepository = new InMemoryClientsRepository()
		inMemoryPushRepository = new InMemoryPushNotificationsRepository()
		createNotificationUseCase = new CreateNotificationUseCase(
			inMemoryNotificationsRepository,
			inMemoryClientsRepository,
			inMemoryPushRepository,
		)
		sut = new SendLeaseExpiryNotificationsUseCase(
			inMemoryLeasesRepository,
			inMemoryNotificationsRepository,
			inMemoryPropertiesRepository,
			createNotificationUseCase,
		)
	})

	it('should handle no expiring leases gracefully', async () => {
		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.notificationsSent).toBe(0)
		}
	})

	it('should send notifications for lease expiring in 60 days', async () => {
		const endDate = new Date()
		endDate.setDate(endDate.getDate() + 60)

		const managerId = new UniqueEntityId('manager-1')
		const tenantId = new UniqueEntityId('tenant-1')
		const property = makeProperty({ managerId })
		await inMemoryPropertiesRepository.create(property)

		const lease = makeLease({
			status: LeaseStatus.create('ACTIVE'),
			endDate,
			tenantId,
			propertyId: property.id,
		})
		await inMemoryLeasesRepository.create(lease)

		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.notificationsSent).toBe(2) // tenant + manager
		}

		const leaseExpiryNotifications =
			inMemoryNotificationsRepository.items.filter(
				(n) => n.actionType === ActionType.LEASE_EXPIRY,
			)
		expect(leaseExpiryNotifications).toHaveLength(2)
	})

	it('should not send for lease expiring in 45 days (not a trigger interval)', async () => {
		const endDate = new Date()
		endDate.setDate(endDate.getDate() + 45)

		const property = makeProperty()
		await inMemoryPropertiesRepository.create(property)

		const lease = makeLease({
			status: LeaseStatus.create('ACTIVE'),
			endDate,
			propertyId: property.id,
		})
		await inMemoryLeasesRepository.create(lease)

		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.notificationsSent).toBe(0)
		}
	})

	it('should not duplicate notifications within 7 days', async () => {
		const endDate = new Date()
		endDate.setDate(endDate.getDate() + 30)

		const managerId = new UniqueEntityId('manager-2')
		const tenantId = new UniqueEntityId('tenant-2')
		const property = makeProperty({ managerId })
		await inMemoryPropertiesRepository.create(property)

		const lease = makeLease({
			status: LeaseStatus.create('ACTIVE'),
			endDate,
			tenantId,
			propertyId: property.id,
		})
		await inMemoryLeasesRepository.create(lease)

		// First run
		await sut.execute()
		// Second run — should deduplicate
		const result = await sut.execute()

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.notificationsSent).toBe(0)
		}
		expect(inMemoryNotificationsRepository.items).toHaveLength(2) // only from first run
	})
})
