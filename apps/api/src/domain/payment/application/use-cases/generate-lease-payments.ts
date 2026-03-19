import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { LeasesRepository } from '@/domain/lease-management/application/repositories/leases-repository'
import { Payment } from '../../enterprise/entities/payment'
import { PaymentsRepository } from '../repositories/payments-repository'
import { PaymentNoActiveLeaseError } from './errors/payment-no-active-lease-error'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface GenerateLeasePaymentsUseCaseRequest {
	leaseId: string
}

type GenerateLeasePaymentsUseCaseResponse = Either<
	PaymentNoActiveLeaseError,
	{ payments: Payment[] }
>

@Injectable()
export class GenerateLeasePaymentsUseCase {
	constructor(
		private leasesRepository: LeasesRepository,
		private paymentsRepository: PaymentsRepository,
	) {}

	async execute({
		leaseId,
	}: GenerateLeasePaymentsUseCaseRequest): Promise<GenerateLeasePaymentsUseCaseResponse> {
		const lease = await this.leasesRepository.findById(leaseId)

		if (!lease || lease.status !== 'ACTIVE') {
			return left(new PaymentNoActiveLeaseError())
		}

		const now = new Date()
		const dueDates = this.getPaymentDueDates(lease.startDate, now)

		const created: Payment[] = []

		for (const dueDate of dueDates) {
			const existing = await this.paymentsRepository.findExistingForLease(
				leaseId,
				dueDate,
			)
			if (existing) continue

			const isPastOrToday = dueDate <= now
			const status = isPastOrToday ? 'PENDING' : 'UPCOMING'

			const payment = Payment.create({
				leaseId: new UniqueEntityId(leaseId),
				tenantId: lease.tenantId,
				amount: lease.monthlyRent,
				dueDate,
				status: status as any,
			})

			await this.paymentsRepository.create(payment)
			created.push(payment)
		}

		return right({ payments: created })
	}

	private getPaymentDueDates(leaseStartDate: Date, now: Date): Date[] {
		const dates: Date[] = []

		// Current month's due date: 1st of the current month
		const currentMonthDue = new Date(now.getFullYear(), now.getMonth(), 1)

		// Next month's due date
		const nextMonthDue = new Date(now.getFullYear(), now.getMonth() + 1, 1)

		// Include current month if the lease has started
		if (
			leaseStartDate <= currentMonthDue ||
			leaseStartDate.getMonth() === now.getMonth()
		) {
			dates.push(currentMonthDue)
		}

		dates.push(nextMonthDue)

		return dates
	}
}
