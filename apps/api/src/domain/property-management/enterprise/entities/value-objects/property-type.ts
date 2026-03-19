import { ValueObject } from '@/core/entities/value-object'

export type PropertyTypeValue =
	| 'APARTMENT'
	| 'HOUSE'
	| 'CONDO'
	| 'TOWNHOUSE'
	| 'STUDIO'

interface PropertyTypeProps {
	value: PropertyTypeValue
}

export class PropertyType extends ValueObject<PropertyTypeProps> {
	private static ALLOWED_TYPES: PropertyTypeValue[] = [
		'APARTMENT',
		'HOUSE',
		'CONDO',
		'TOWNHOUSE',
		'STUDIO',
	]

	private constructor(props: PropertyTypeProps) {
		super(props)
	}

	static create(type: string): PropertyType {
		if (!PropertyType.ALLOWED_TYPES.includes(type as PropertyTypeValue)) {
			throw new Error(`Invalid property type: ${type}`)
		}
		return new PropertyType({ value: type as PropertyTypeValue })
	}

	get value(): PropertyTypeValue {
		return this.props.value
	}

	static values(): PropertyTypeValue[] {
		return PropertyType.ALLOWED_TYPES
	}
}
