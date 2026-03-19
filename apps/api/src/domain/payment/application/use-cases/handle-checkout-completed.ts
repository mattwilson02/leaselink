import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { LeasesRepository } from '@/domain/lease-management/application/repositories/leases-repository'
import { PropertiesRepository } from '@/domain/property-management/application/repositories/properties-repository'
import { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import {
	ActionType,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'
import { PaymentsRepository } from '../repositories/payments-repository'
import { PaymentNotFoundError } from './errors/payment-not-found-error'

export interface HandleCheckoutCompletedUseCaseRequest {
	stripeSessionId: string
	stripePaymentIntentId: string
}

type HandleCheckoutCompletedUseCaseResponse = Either<
	PaymentNotFoundError,
	{ success: true }
>

@Injectable()
export class HandleCheckoutCompletedUseCase {
	constructor(
		private paymentsRepository: PaymentsRepository,
		private leasesRepository: LeasesRepository,
		private propertiesRepository: PropertiesRepository,
		private createNotificationUseCase: CreateNotificationUseCase,
	) {}

	async execute({
		stripeSessionId,
		stripePaymentIntentId,
	}: HandleCheckoutCompletedUseCaseRequest): Promise<HandleCheckoutCompletedUseCaseResponse> {
		const payment =
			await this.paymentsRepository.findByStripeSessionId(stripeSessionId)

		if (!payment) {
			return left(new PaymentNotFoundError())
		}

		// Idempotent: already paid
		if (payment.status === 'PAID') {
			return right({ success: true })
		}

		payment.status = 'PAID'
		payment.paidAt = new Date()
		payment.stripePaymentIntentId = stripePaymentIntentId

		await this.paymentsRepository.update(payment)

		// Notify manager
		const lease = await this.leasesRepository.findById(
			payment.leaseId.toString(),
		)
		if (lease) {
			const property = await this.propertiesRepository.findById(
				lease.propertyId.toString(),
			)
			if (property) {
				const amountFormatted = `$${payment.amount.toFixed(2)}`
				await this.createNotificationUseCase.execute({
					personId: property.managerId.toString(),
					text: `Payment of ${amountFormatted} received for ${property.address}`,
					notificationType: NotificationType.INFO,
					actionType: ActionType.PAYMENT_RECEIVED,
					linkedPaymentId: payment.id.toString(),
				})
			}
		}

		return right({ success: true })
	}
}
