import { ValueObject } from '@/core/entities/value-object'

export type LeaseStatusType = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'

interface LeaseStatusProps {
	value: LeaseStatusType
}

export class LeaseStatus extends ValueObject<LeaseStatusProps> {
	private static ALLOWED_STATUSES: LeaseStatusType[] = [
		'PENDING',
		'ACTIVE',
		'EXPIRED',
		'TERMINATED',
	]

	private constructor(props: LeaseStatusProps) {
		super(props)
	}

	static create(status: string): LeaseStatus {
		if (!LeaseStatus.ALLOWED_STATUSES.includes(status as LeaseStatusType)) {
			throw new Error(`Invalid lease status: ${status}`)
		}
		return new LeaseStatus({ value: status as LeaseStatusType })
	}

	get value(): LeaseStatusType {
		return this.props.value
	}

	static values(): LeaseStatusType[] {
		return LeaseStatus.ALLOWED_STATUSES
	}
}
