import { RentReminderSchedulerService } from './rent-reminder-scheduler.service'
import { right } from '@/core/either'
import type { SendRentDueRemindersUseCase } from '@/domain/payment/application/use-cases/send-rent-due-reminders'
import type { EnvService } from '../env/env.service'

class MockSendRentDueReminders {
	calls = 0
	async execute() {
		this.calls++
		return right({ remindersSent: 3 })
	}
}

const makeEnvService = (enabled: boolean) =>
	({
		get: () => enabled,
	}) as unknown as EnvService

describe('RentReminderSchedulerService', () => {
	describe('when SCHEDULER_ENABLED is true', () => {
		it('should call SendRentDueRemindersUseCase when SCHEDULER_ENABLED=true', async () => {
			const sendRentDueReminders = new MockSendRentDueReminders()
			const sut = new RentReminderSchedulerService(
				sendRentDueReminders as unknown as SendRentDueRemindersUseCase,
				makeEnvService(true),
			)

			await sut.handleRentDueReminders()

			expect(sendRentDueReminders.calls).toBe(1)
		})
	})

	describe('when SCHEDULER_ENABLED is false', () => {
		it('should not call SendRentDueRemindersUseCase when SCHEDULER_ENABLED=false', async () => {
			const sendRentDueReminders = new MockSendRentDueReminders()
			const sut = new RentReminderSchedulerService(
				sendRentDueReminders as unknown as SendRentDueRemindersUseCase,
				makeEnvService(false),
			)

			await sut.handleRentDueReminders()

			expect(sendRentDueReminders.calls).toBe(0)
		})
	})
})
