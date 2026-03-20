import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { PaymentsRepository } from '../repositories/payments-repository'

type ActivateUpcomingPaymentsUseCaseResponse = Either<
	never,
	{ activatedCount: number }
>

@Injectable()
export class ActivateUpcomingPaymentsUseCase {
	constructor(private paymentsRepository: PaymentsRepository) {}

	async execute(): Promise<ActivateUpcomingPaymentsUseCaseResponse> {
		const today = new Date()
		const upcomingPayments =
			await this.paymentsRepository.findUpcomingDueByDate(today)

		for (const payment of upcomingPayments) {
			payment.status = 'PENDING'
			await this.paymentsRepository.update(payment)
		}

		return right({ activatedCount: upcomingPayments.length })
	}
}
