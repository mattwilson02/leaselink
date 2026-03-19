import { ValueObject } from '@/core/entities/value-object'

export type PaymentStatusType = 'UPCOMING' | 'PENDING' | 'PAID' | 'OVERDUE'

export class PaymentStatus extends ValueObject<{ value: PaymentStatusType }> {
	private static ALLOWED_STATUSES: PaymentStatusType[] = [
		'UPCOMING',
		'PENDING',
		'PAID',
		'OVERDUE',
	]

	private constructor(props: { value: PaymentStatusType }) {
		super(props)
	}

	static create(status: string): PaymentStatus {
		if (!PaymentStatus.ALLOWED_STATUSES.includes(status as PaymentStatusType)) {
			throw new Error(`Invalid payment status: ${status}`)
		}
		return new PaymentStatus({ value: status as PaymentStatusType })
	}

	get value(): PaymentStatusType {
		return this.props.value
	}

	static values(): PaymentStatusType[] {
		return [...PaymentStatus.ALLOWED_STATUSES]
	}
}
