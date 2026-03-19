import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Payment } from '../../enterprise/entities/payment'
import { PaymentsRepository } from '../repositories/payments-repository'
import { PaymentNotFoundError } from './errors/payment-not-found-error'

export interface GetPaymentByIdUseCaseRequest {
	paymentId: string
	userId: string
	userRole: 'CLIENT' | 'EMPLOYEE'
}

type GetPaymentByIdUseCaseResponse = Either<
	PaymentNotFoundError,
	{ payment: Payment }
>

@Injectable()
export class GetPaymentByIdUseCase {
	constructor(private paymentsRepository: PaymentsRepository) {}

	async execute({
		paymentId,
		userId,
		userRole,
	}: GetPaymentByIdUseCaseRequest): Promise<GetPaymentByIdUseCaseResponse> {
		const payment = await this.paymentsRepository.findById(paymentId)

		if (!payment) {
			return left(new PaymentNotFoundError())
		}

		// Tenants can only view their own payments
		if (userRole === 'CLIENT' && payment.tenantId.toString() !== userId) {
			return left(new PaymentNotFoundError())
		}

		return right({ payment })
	}
}
