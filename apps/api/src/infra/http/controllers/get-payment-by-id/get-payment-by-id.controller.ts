import { GetPaymentByIdUseCase } from '@/domain/payment/application/use-cases/get-payment-by-id'
import { Controller, Get, NotFoundException, Param } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpPaymentPresenter } from '../../presenters/http-payment-presenter'

@ApiTags('Payments')
@Controller('/payments')
export class GetPaymentByIdController {
	constructor(private getPaymentById: GetPaymentByIdUseCase) {}

	@Get(':id')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get payment by ID' })
	@ApiParam({ name: 'id', type: String })
	@ApiResponse({ status: 200, description: 'Payment found' })
	@ApiResponse({ status: 404, description: 'Payment not found' })
	async handle(@CurrentUser() user: HttpUserResponse, @Param('id') id: string) {
		const response = await this.getPaymentById.execute({
			paymentId: id,
			userId: user.id,
			userRole: user.type,
		})

		if (response.isLeft()) {
			throw new NotFoundException(response.value.message)
		}

		return {
			data: HttpPaymentPresenter.toHTTP(response.value.payment),
		}
	}
}
