import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { PaymentsRepository } from '../repositories/payments-repository'
import { NotificationRepository } from '@/domain/notification/application/repositories/notification-repository'
import { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import {
	ActionType,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'

const RENT_REMINDER_DAYS = 3

type SendRentDueRemindersUseCaseResponse = Either<
	never,
	{ remindersSent: number }
>

@Injectable()
export class SendRentDueRemindersUseCase {
	constructor(
		private paymentsRepository: PaymentsRepository,
		private notificationRepository: NotificationRepository,
		private createNotificationUseCase: CreateNotificationUseCase,
	) {}

	async execute(): Promise<SendRentDueRemindersUseCaseResponse> {
		const pendingPayments =
			await this.paymentsRepository.findPendingDueWithin(RENT_REMINDER_DAYS)

		let remindersSent = 0
		const startOfToday = new Date()
		startOfToday.setUTCHours(0, 0, 0, 0)

		for (const payment of pendingPayments) {
			const alreadySent =
				await this.notificationRepository.existsByActionTypeAndLinkedId({
					actionType: ActionType.RENT_REMINDER,
					personId: payment.tenantId.toString(),
					linkedPaymentId: payment.id.toString(),
					createdAfter: startOfToday,
				})

			if (alreadySent) continue

			const formattedAmount = `$${payment.amount.toFixed(2)}`
			const formattedDate = payment.dueDate.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			})

			await this.createNotificationUseCase.execute({
				personId: payment.tenantId.toString(),
				text: `Your rent payment of ${formattedAmount} is due on ${formattedDate}.`,
				notificationType: NotificationType.ACTION,
				actionType: ActionType.RENT_REMINDER,
				linkedPaymentId: payment.id.toString(),
			})

			remindersSent++
		}

		return right({ remindersSent })
	}
}
