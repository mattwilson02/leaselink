import { GetPaymentsByTenantUseCase } from '@/domain/payment/application/use-cases/get-payments-by-tenant'
import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { paymentFilterSchema } from '@leaselink/shared'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpPaymentPresenter } from '../../presenters/http-payment-presenter'
import { z } from 'zod'

type PaymentFilterQuery = z.infer<typeof paymentFilterSchema>

const queryValidationPipe = new ZodValidationPipe(paymentFilterSchema)

@ApiTags('Payments')
@Controller('/payments')
export class GetPaymentsByTenantController {
	constructor(private getPaymentsByTenant: GetPaymentsByTenantUseCase) {}

	@Get('tenant')
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get tenant's own payments" })
	@ApiQuery({ name: 'status', required: false })
	@ApiQuery({ name: 'page', required: false, type: Number })
	@ApiQuery({ name: 'pageSize', required: false, type: Number })
	@ApiResponse({
		status: 200,
		description: "Paginated list of tenant's payments",
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Query(queryValidationPipe) query: PaymentFilterQuery,
	) {
		if (user.type !== 'CLIENT') {
			throw new UnauthorizedException('Only tenants can access this endpoint')
		}

		const response = await this.getPaymentsByTenant.execute({
			tenantId: user.id,
			status: query.status,
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
