import { PAYMENT_INVALID_STATUS_TRANSITION } from '@leaselink/shared'

export class InvalidPaymentStatusTransitionError extends Error {
	constructor() {
		super(PAYMENT_INVALID_STATUS_TRANSITION)
		this.name = 'InvalidPaymentStatusTransitionError'
	}
}
