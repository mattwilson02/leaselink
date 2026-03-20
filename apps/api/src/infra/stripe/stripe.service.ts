import { Injectable } from "@nestjs/common";
import Stripe from "stripe";
import { EnvService } from "../env/env.service";
import { StripeService as AbstractStripeService } from "@/domain/payment/application/stripe/stripe-service";

@Injectable()
export class StripeServiceImpl extends AbstractStripeService {
	private stripe: Stripe;

	constructor(private envService: EnvService) {
		super();
		this.stripe = new Stripe(this.envService.get("STRIPE_SECRET_KEY"), {
			apiVersion: "2026-02-25.clover",
		});
	}

	async createCheckoutSession(params: {
		amount: number;
		currency: string;
		description: string;
		metadata: Record<string, string>;
		successUrl: string;
		cancelUrl: string;
	}): Promise<{ sessionId: string; url: string }> {
		const session = await this.stripe.checkout.sessions.create({
			mode: "payment",
			line_items: [
				{
					price_data: {
						currency: params.currency,
						product_data: {
							name: params.description,
						},
						unit_amount: params.amount,
					},
					quantity: 1,
				},
			],
			metadata: params.metadata,
			success_url: params.successUrl,
			cancel_url: params.cancelUrl,
		});

		return {
			sessionId: session.id,
			url: session.url!,
		};
	}

	constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
		return this.stripe.webhooks.constructEvent(
			payload,
			signature,
			this.envService.get("STRIPE_WEBHOOK_SECRET"),
		);
	}
}
