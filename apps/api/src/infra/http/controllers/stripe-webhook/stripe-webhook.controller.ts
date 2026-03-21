import { HandleCheckoutCompletedUseCase } from '@/domain/payment/application/use-cases/handle-checkout-completed'
import {
	Controller,
	Headers,
	HttpCode,
	HttpStatus,
	Logger,
	Post,
	Req,
} from '@nestjs/common'
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger'
import { Public } from '@thallesp/nestjs-better-auth'
import { StripeServiceImpl } from '@/infra/stripe/stripe.service'
import { Request } from 'express'

@ApiTags('Payments')
@Controller('/payments')
export class StripeWebhookController {
	private readonly logger = new Logger(StripeWebhookController.name)

	constructor(
		private handleCheckoutCompleted: HandleCheckoutCompletedUseCase,
		private stripeService: StripeServiceImpl,
	) {}

	@Post('webhook')
	@Public()
	@HttpCode(HttpStatus.OK)
	@ApiExcludeEndpoint()
	async handle(
		@Req() req: Request,
		@Headers('stripe-signature') signature: string,
	) {
		try {
			const rawBody = (req as any).rawBody as Buffer
			const event = this.stripeService.constructWebhookEvent(rawBody, signature)

			if (event.type === 'checkout.session.completed') {
				const session = event.data.object as any
				const result = await this.handleCheckoutCompleted.execute({
					stripeSessionId: session.id,
					stripePaymentIntentId: session.payment_intent ?? '',
				})

				if (result.isLeft()) {
					this.logger.error(
						`Payment not found for Stripe session: ${session.id}`,
					)
				} else {
					this.logger.log(`Payment confirmed for Stripe session: ${session.id}`)
				}
			}

			return { received: true }
		} catch (err) {
			this.logger.error(
				'Error processing Stripe webhook event',
				err instanceof Error ? err.stack : String(err),
			)
			// Always return 200 to Stripe to prevent retries of malformed events
			return { received: true }
		}
	}
}
