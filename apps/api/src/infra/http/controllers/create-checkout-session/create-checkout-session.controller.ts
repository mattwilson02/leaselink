import { CreateCheckoutSessionUseCase } from '@/domain/payment/application/use-cases/create-checkout-session'
import { PaymentNotFoundError } from '@/domain/payment/application/use-cases/errors/payment-not-found-error'
import { PaymentAlreadyPaidError } from '@/domain/payment/application/use-cases/errors/payment-already-paid-error'
import { PaymentNotPayableError } from '@/domain/payment/application/use-cases/errors/payment-not-payable-error'
import {
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
	UnauthorizedException,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { EnvService } from '@/infra/env/env.service'

@ApiTags('Payments')
@Controller('/payments')
export class CreateCheckoutSessionController {
	constructor(
		private createCheckoutSession: CreateCheckoutSessionUseCase,
		private envService: EnvService,
	) {}

	@Post(':id/checkout')
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Create Stripe Checkout Session for a payment (tenant only)',
	})
	@ApiParam({ name: 'id', type: String })
	@ApiResponse({ status: 200, description: 'Checkout session URL' })
	@ApiResponse({ status: 404, description: 'Payment not found' })
	@ApiResponse({ status: 409, description: 'Payment already paid' })
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') id: string,
		@Body() body?: { successUrl?: string; cancelUrl?: string },
	) {
		if (user.type !== 'CLIENT') {
			throw new UnauthorizedException('Only tenants can initiate payments')
		}

		const response = await this.createCheckoutSession.execute({
			paymentId: id,
			tenantId: user.id,
			successUrl: body?.successUrl || this.envService.get('STRIPE_SUCCESS_URL'),
			cancelUrl: body?.cancelUrl || this.envService.get('STRIPE_CANCEL_URL'),
		})

		if (response.isLeft()) {
			const error = response.value
			if (error instanceof PaymentNotFoundError) {
				throw new NotFoundException(error.message)
			}
			if (error instanceof PaymentAlreadyPaidError) {
				throw new ConflictException(error.message)
			}
			if (error instanceof PaymentNotPayableError) {
				throw new BadRequestException(error.message)
			}
			throw new BadRequestException('Payment operation failed')
		}

		return { url: response.value.url }
	}
}
