import { LeaseSchedulerService } from './lease-scheduler.service'
import { right } from '@/core/either'
import type { ActivatePendingLeasesUseCase } from '@/domain/lease-management/application/use-cases/activate-pending-leases'
import type { SendLeaseExpiryNotificationsUseCase } from '@/domain/lease-management/application/use-cases/send-lease-expiry-notifications'
import type { EnvService } from '../env/env.service'

class MockActivatePendingLeases {
	calls = 0
	async execute() {
		this.calls++
		return right({ activatedCount: 2 })
	}
}

class MockSendLeaseExpiryNotifications {
	calls = 0
	async execute() {
		this.calls++
		return right({ notificationsSent: 1 })
	}
}

const makeEnvService = (enabled: boolean) =>
	({
		get: () => enabled,
	}) as unknown as EnvService

describe('LeaseSchedulerService', () => {
	describe('when SCHEDULER_ENABLED is true', () => {
		let activatePendingLeases: MockActivatePendingLeases
		let sendLeaseExpiryNotifications: MockSendLeaseExpiryNotifications
		let sut: LeaseSchedulerService

		beforeEach(() => {
			activatePendingLeases = new MockActivatePendingLeases()
			sendLeaseExpiryNotifications = new MockSendLeaseExpiryNotifications()
			sut = new LeaseSchedulerService(
				sendLeaseExpiryNotifications as unknown as SendLeaseExpiryNotificationsUseCase,
				activatePendingLeases as unknown as ActivatePendingLeasesUseCase,
				makeEnvService(true),
			)
		})

		it('should call ActivatePendingLeasesUseCase when SCHEDULER_ENABLED=true', async () => {
			await sut.handlePendingLeaseActivation()
			expect(activatePendingLeases.calls).toBe(1)
		})

		it('should call SendLeaseExpiryNotificationsUseCase when SCHEDULER_ENABLED=true', async () => {
			await sut.handleLeaseExpiryNotifications()
			expect(sendLeaseExpiryNotifications.calls).toBe(1)
		})
	})

	describe('when SCHEDULER_ENABLED is false', () => {
		let activatePendingLeases: MockActivatePendingLeases
		let sendLeaseExpiryNotifications: MockSendLeaseExpiryNotifications
		let sut: LeaseSchedulerService

		beforeEach(() => {
			activatePendingLeases = new MockActivatePendingLeases()
			sendLeaseExpiryNotifications = new MockSendLeaseExpiryNotifications()
			sut = new LeaseSchedulerService(
				sendLeaseExpiryNotifications as unknown as SendLeaseExpiryNotificationsUseCase,
				activatePendingLeases as unknown as ActivatePendingLeasesUseCase,
				makeEnvService(false),
			)
		})

		it('should not call ActivatePendingLeasesUseCase when SCHEDULER_ENABLED=false', async () => {
			await sut.handlePendingLeaseActivation()
			expect(activatePendingLeases.calls).toBe(0)
		})

		it('should not call SendLeaseExpiryNotificationsUseCase when SCHEDULER_ENABLED=false', async () => {
			await sut.handleLeaseExpiryNotifications()
			expect(sendLeaseExpiryNotifications.calls).toBe(0)
		})
	})
})
