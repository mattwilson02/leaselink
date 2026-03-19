import { HandleCheckoutCompletedUseCase } from '@/domain/payment/application/use-cases/handle-checkout-completed'
import {
	Controller,
	Headers,
	HttpCode,
	HttpStatus,
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
					// biome-ignore lint/suspicious/noConsole: webhook error logging
					console.error('[Webhook] Payment not found for session:', session.id)
				}
			}

			return { received: true }
		} catch (err) {
			// biome-ignore lint/suspicious/noConsole: webhook error logging
			console.error('[Webhook] Error processing event:', err)
			// Always return 200 to Stripe
			return { received: true }
		}
	}
}
