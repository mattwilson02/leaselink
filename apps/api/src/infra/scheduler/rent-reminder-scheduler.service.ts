import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { SendRentDueRemindersUseCase } from '@/domain/payment/application/use-cases/send-rent-due-reminders'
import { EnvService } from '../env/env.service'

@Injectable()
export class RentReminderSchedulerService {
	private readonly logger = new Logger(RentReminderSchedulerService.name)

	constructor(
		private sendRentDueReminders: SendRentDueRemindersUseCase,
		private envService: EnvService,
	) {}

	@Cron('0 8 * * *')
	async handleRentDueReminders() {
		if (!this.envService.get('SCHEDULER_ENABLED')) return

		this.logger.log('Running rent due reminders...')
		try {
			const result = await this.sendRentDueReminders.execute()

			if (result.isRight()) {
				this.logger.log(
					`Rent reminders complete: ${result.value.remindersSent} reminders sent`,
				)
			}
		} catch (error) {
			this.logger.error(
				'Rent due reminders failed',
				error instanceof Error ? error.stack : error,
			)
		}
	}
}
