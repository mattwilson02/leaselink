import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { SendLeaseExpiryNotificationsUseCase } from '@/domain/lease-management/application/use-cases/send-lease-expiry-notifications'
import { ActivatePendingLeasesUseCase } from '@/domain/lease-management/application/use-cases/activate-pending-leases'
import { EnvService } from '../env/env.service'

@Injectable()
export class LeaseSchedulerService {
	private readonly logger = new Logger(LeaseSchedulerService.name)

	constructor(
		private sendLeaseExpiryNotifications: SendLeaseExpiryNotificationsUseCase,
		private activatePendingLeases: ActivatePendingLeasesUseCase,
		private envService: EnvService,
	) {}

	@Cron('0 0 * * *')
	async handlePendingLeaseActivation() {
		if (!this.envService.get('SCHEDULER_ENABLED')) return

		this.logger.log('Running pending lease activation...')
		try {
			const result = await this.activatePendingLeases.execute()

			if (result.isRight()) {
				this.logger.log(
					`Lease activation complete: ${result.value.activatedCount} leases activated`,
				)
			}
		} catch (error) {
			this.logger.error(
				'Pending lease activation failed',
				error instanceof Error ? error.stack : error,
			)
		}
	}

	@Cron('0 6 * * *')
	async handleLeaseExpiryNotifications() {
		if (!this.envService.get('SCHEDULER_ENABLED')) return

		this.logger.log('Running lease expiry notification check...')
		try {
			const result = await this.sendLeaseExpiryNotifications.execute()

			if (result.isRight()) {
				this.logger.log(
					`Lease expiry check complete: ${result.value.notificationsSent} notifications sent`,
				)
			}
		} catch (error) {
			this.logger.error(
				'Lease expiry notification failed',
				error instanceof Error ? error.stack : error,
			)
		}
	}
}
