import { PAYMENT_NO_ACTIVE_LEASE } from '@leaselink/shared'

export class PaymentNoActiveLeaseError extends Error {
	constructor() {
		super(PAYMENT_NO_ACTIVE_LEASE)
		this.name = 'PaymentNoActiveLeaseError'
	}
}
