import { PAYMENT_ALREADY_PAID } from '@leaselink/shared'

export class PaymentAlreadyPaidError extends Error {
	constructor() {
		super(PAYMENT_ALREADY_PAID)
		this.name = 'PaymentAlreadyPaidError'
	}
}
