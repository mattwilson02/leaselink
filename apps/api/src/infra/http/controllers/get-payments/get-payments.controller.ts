import { GetPaymentsUseCase } from '@/domain/payment/application/use-cases/get-payments'
import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { paymentFilterSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpPaymentPresenter } from '../../presenters/http-payment-presenter'
import { z } from 'zod'

type PaymentFilterQuery = z.infer<typeof paymentFilterSchema>

const queryValidationPipe = new ZodValidationPipe(paymentFilterSchema)

@ApiTags('Payments')
@Controller('/payments')
export class GetPaymentsController {
	constructor(private getPayments: GetPaymentsUseCase) {}

	@Get()
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get payments (manager only)' })
	@ApiQuery({ name: 'status', required: false })
	@ApiQuery({ name: 'leaseId', required: false })
	@ApiQuery({ name: 'tenantId', required: false })
	@ApiQuery({ name: 'page', required: false, type: Number })
	@ApiQuery({ name: 'pageSize', required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Paginated list of payments' })
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Query(queryValidationPipe) query: PaymentFilterQuery,
	) {
		const response = await this.getPayments.execute({
			managerId: user.id,
			status: query.status,
			leaseId: query.leaseId,
			tenantId: query.tenantId,
			page: query.page ?? 1,
			pageSize: query.pageSize ?? 20,
		})

		return {
			data: HttpPaymentPresenter.toHTTPList(response.value.payments),
			meta: {
				page: query.page ?? 1,
				pageSize: query.pageSize ?? 20,
				totalCount: response.value.totalCount,
				totalPages: Math.ceil(
					response.value.totalCount / (query.pageSize ?? 20),
				),
			},
		}
	}
}
