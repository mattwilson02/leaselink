import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Payment } from '../../enterprise/entities/payment'
import {
	PaymentsRepository,
	PaymentsByTenantParams,
} from '../repositories/payments-repository'

export interface GetPaymentsByTenantUseCaseRequest {
	tenantId: string
	status?: string
	page: number
	pageSize: number
}

type GetPaymentsByTenantUseCaseResponse = Either<
	never,
	{ payments: Payment[]; totalCount: number }
>

@Injectable()
export class GetPaymentsByTenantUseCase {
	constructor(private paymentsRepository: PaymentsRepository) {}

	async execute(
		request: GetPaymentsByTenantUseCaseRequest,
	): Promise<GetPaymentsByTenantUseCaseResponse> {
		const params: PaymentsByTenantParams = {
			tenantId: request.tenantId,
			status: request.status,
			page: request.page,
			pageSize: request.pageSize,
		}

		const result = await this.paymentsRepository.findManyByTenant(params)

		return right({ payments: result.payments, totalCount: result.totalCount })
	}
}
