import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { PAYMENT_GRACE_PERIOD_DAYS } from '@leaselink/shared'
import { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import {
	ActionType,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'
import { PaymentsRepository } from '../repositories/payments-repository'

type MarkOverduePaymentsUseCaseResponse = Either<
	never,
	{ overdueCount: number }
>

@Injectable()
export class MarkOverduePaymentsUseCase {
	constructor(
		private paymentsRepository: PaymentsRepository,
		private createNotificationUseCase: CreateNotificationUseCase,
	) {}

	async execute(): Promise<MarkOverduePaymentsUseCaseResponse> {
		const overduePayments = await this.paymentsRepository.findPendingOverdue(
			PAYMENT_GRACE_PERIOD_DAYS,
		)

		for (const payment of overduePayments) {
			payment.status = 'OVERDUE'
			await this.paymentsRepository.update(payment)

			const amountFormatted = `$${payment.amount.toFixed(2)}`
			await this.createNotificationUseCase.execute({
				personId: payment.tenantId.toString(),
				text: `Your rent payment of ${amountFormatted} is overdue`,
				notificationType: NotificationType.ACTION,
				actionType: ActionType.PAYMENT_OVERDUE,
				linkedPaymentId: payment.id.toString(),
			})
		}

		return right({ overdueCount: overduePayments.length })
	}
}
