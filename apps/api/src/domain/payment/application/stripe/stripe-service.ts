export abstract class StripeService {
	abstract createCheckoutSession(params: {
		amount: number
		currency: string
		description: string
		metadata: Record<string, string>
		successUrl: string
		cancelUrl: string
	}): Promise<{ sessionId: string; url: string }>
}
