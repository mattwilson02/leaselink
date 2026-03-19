import { PAYMENT_NOT_FOUND } from '@leaselink/shared'

export class PaymentNotFoundError extends Error {
	constructor() {
		super(PAYMENT_NOT_FOUND)
		this.name = 'PaymentNotFoundError'
	}
}
