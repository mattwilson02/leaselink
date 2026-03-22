import { HandleCheckoutCompletedUseCase } from '@/domain/payment/application/use-cases/handle-checkout-completed'
import { PaymentsRepository } from '@/domain/payment/application/repositories/payments-repository'
import { StripeServiceImpl } from '@/infra/stripe/stripe.service'
import {
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

@ApiTags('Payments')
@Controller('/payments')
export class VerifyPaymentController {
	constructor(
		private paymentsRepository: PaymentsRepository,
		private stripeService: StripeServiceImpl,
		private handleCheckoutCompleted: HandleCheckoutCompletedUseCase,
	) {}

	@Post(':id/verify')
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({
		summary:
			'Verify payment status by checking Stripe session (for mobile clients)',
	})
	@ApiParam({ name: 'id', type: String })
	@ApiResponse({ status: 200, description: 'Payment verification result' })
	@ApiResponse({ status: 404, description: 'Payment not found' })
	async handle(@CurrentUser() user: HttpUserResponse, @Param('id') id: string) {
		if (user.type !== 'CLIENT') {
			throw new UnauthorizedException('Only tenants can verify payments')
		}

		const payment = await this.paymentsRepository.findById(id)

		if (!payment || payment.tenantId.toString() !== user.id) {
			throw new NotFoundException('Payment not found')
		}

		// Already paid - no need to check Stripe
		if (payment.status === 'PAID') {
			return { status: 'PAID', updated: false }
		}

		// No checkout session to verify
		if (!payment.stripeCheckoutSessionId) {
			return { status: payment.status, updated: false }
		}

		// Check Stripe session status
		const session = await this.stripeService.retrieveSession(
			payment.stripeCheckoutSessionId,
		)

		if (session.paymentStatus === 'paid') {
			// Process the payment just like the webhook would
			const result = await this.handleCheckoutCompleted.execute({
				stripeSessionId: payment.stripeCheckoutSessionId,
				stripePaymentIntentId: session.paymentIntentId ?? '',
			})

			if (result.isRight()) {
				return { status: 'PAID', updated: true }
			}
		}

		return { status: payment.status, updated: false }
	}
}
