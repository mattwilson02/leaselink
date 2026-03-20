import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { GenerateAllLeasePaymentsUseCase } from '@/domain/payment/application/use-cases/generate-all-lease-payments'
import { MarkOverduePaymentsUseCase } from '@/domain/payment/application/use-cases/mark-overdue-payments'
import { EnvService } from '../env/env.service'

@Injectable()
export class PaymentSchedulerService {
	private readonly logger = new Logger(PaymentSchedulerService.name)

	constructor(
		private generateAllLeasePayments: GenerateAllLeasePaymentsUseCase,
		private markOverduePayments: MarkOverduePaymentsUseCase,
		private envService: EnvService,
	) {}

	@Cron('5 0 * * *')
	async handlePaymentGeneration() {
		if (!this.envService.get('SCHEDULER_ENABLED')) return

		this.logger.log('Running scheduled payment generation...')
		try {
			const result = await this.generateAllLeasePayments.execute()

			if (result.isRight()) {
				this.logger.log(
					`Payment generation complete: ${result.value.totalGenerated} payments created`,
				)
			}
		} catch (error) {
			this.logger.error(
				'Payment generation failed',
				error instanceof Error ? error.stack : error,
			)
		}
	}

	@Cron('30 0 * * *')
	async handleOverdueDetection() {
		if (!this.envService.get('SCHEDULER_ENABLED')) return

		this.logger.log('Running overdue payment detection...')
		try {
			const result = await this.markOverduePayments.execute()

			if (result.isRight()) {
				this.logger.log(
					`Overdue detection complete: ${result.value.overdueCount} payments marked overdue`,
				)
			}
		} catch (error) {
			this.logger.error(
				'Overdue detection failed',
				error instanceof Error ? error.stack : error,
			)
		}
	}
}
