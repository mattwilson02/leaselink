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
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import Stripe from 'stripe'

@ApiTags('Payments')
@Controller('/payments')
export class StripeWebhookController {
	private readonly logger = new Logger(StripeWebhookController.name)

	constructor(
		private handleCheckoutCompleted: HandleCheckoutCompletedUseCase,
		private stripeService: StripeServiceImpl,
		private prisma: PrismaService,
	) {}

	@Post('webhook')
	@Public()
	@HttpCode(HttpStatus.OK)
	@ApiExcludeEndpoint()
	async handle(
		@Req() req: Request,
		@Headers('stripe-signature') signature: string,
	) {
		let event: Stripe.Event

		try {
			const rawBody = (req as Request & { rawBody?: Buffer }).rawBody as Buffer
			event = this.stripeService.constructWebhookEvent(rawBody, signature)
		} catch (err) {
			this.logger.error(
				'Stripe signature verification failed',
				err instanceof Error ? err.message : String(err),
			)
			return { received: true }
		}

		try {
			if (event.type === 'checkout.session.completed') {
				const session = event.data.object as unknown as Record<string, unknown>
				const stripeSessionId = session.id as string
				const stripePaymentIntentId = (session.payment_intent ?? '') as string

				const result = await this.handleCheckoutCompleted.execute({
					stripeSessionId,
					stripePaymentIntentId,
				})

				if (result.isLeft()) {
					this.logger.error(
						`Payment not found for Stripe session: ${stripeSessionId}`,
					)
				} else {
					this.logger.log(
						`Payment confirmed for Stripe session: ${stripeSessionId}`,
					)
				}
			}

			return { received: true }
		} catch (err) {
			this.logger.error(
				'Error processing Stripe webhook event',
				err instanceof Error ? err.stack : String(err),
			)

			await this.prisma.failedWebhook.create({
				data: {
					eventId: event.id,
					eventType: event.type,
					// biome-ignore lint/suspicious/noExplicitAny: Prisma Json field requires cast
					payload: event.data.object as unknown as any,
					errorMessage: err instanceof Error ? err.message : String(err),
				},
			})

			return { received: true }
		}
	}
}
