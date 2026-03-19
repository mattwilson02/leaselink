import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Payment } from '../../enterprise/entities/payment'
import {
	PaymentsRepository,
	PaymentsFilterParams,
} from '../repositories/payments-repository'

export interface GetPaymentsUseCaseRequest {
	status?: string
	leaseId?: string
	tenantId?: string
	propertyId?: string
	managerId?: string
	page: number
	pageSize: number
}

type GetPaymentsUseCaseResponse = Either<
	never,
	{ payments: Payment[]; totalCount: number }
>

@Injectable()
export class GetPaymentsUseCase {
	constructor(private paymentsRepository: PaymentsRepository) {}

	async execute(
		request: GetPaymentsUseCaseRequest,
	): Promise<GetPaymentsUseCaseResponse> {
		const params: PaymentsFilterParams = {
			status: request.status,
			leaseId: request.leaseId,
			tenantId: request.tenantId,
			propertyId: request.propertyId,
			managerId: request.managerId,
			page: request.page,
			pageSize: request.pageSize,
		}

		const result = await this.paymentsRepository.findMany(params)

		return right({ payments: result.payments, totalCount: result.totalCount })
	}
}
