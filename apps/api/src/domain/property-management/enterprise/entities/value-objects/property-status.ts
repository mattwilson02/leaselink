import { ValueObject } from '@/core/entities/value-object'

export type PropertyStatusType =
	| 'VACANT'
	| 'LISTED'
	| 'OCCUPIED'
	| 'MAINTENANCE'

interface PropertyStatusProps {
	value: PropertyStatusType
}

export class PropertyStatus extends ValueObject<PropertyStatusProps> {
	// biome-ignore lint/style/useNamingConvention: CONSTANT_CASE for static readonly collection
	private static ALLOWED_STATUSES: PropertyStatusType[] = [
		'VACANT',
		'LISTED',
		'OCCUPIED',
		'MAINTENANCE',
	]

	private constructor(props: PropertyStatusProps) {
		super(props)
	}

	static create(status: string): PropertyStatus {
		if (
			!PropertyStatus.ALLOWED_STATUSES.includes(status as PropertyStatusType)
		) {
			throw new Error(`Invalid property status: ${status}`)
		}
		return new PropertyStatus({ value: status as PropertyStatusType })
	}

	get value(): PropertyStatusType {
		return this.props.value
	}

	static values(): PropertyStatusType[] {
		return PropertyStatus.ALLOWED_STATUSES
	}
}
