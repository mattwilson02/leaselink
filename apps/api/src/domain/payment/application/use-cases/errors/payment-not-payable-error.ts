export class PaymentNotPayableError extends Error {
	constructor() {
		super(
			'Payment is not yet due. Only PENDING or OVERDUE payments can be paid.',
		)
		this.name = 'PaymentNotPayableError'
	}
}
