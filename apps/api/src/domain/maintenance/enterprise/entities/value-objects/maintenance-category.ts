import { ValueObject } from '@/core/entities/value-object'

export type MaintenanceCategoryType =
	| 'PLUMBING'
	| 'ELECTRICAL'
	| 'HVAC'
	| 'APPLIANCE'
	| 'STRUCTURAL'
	| 'PEST_CONTROL'
	| 'OTHER'

interface MaintenanceCategoryProps {
	value: MaintenanceCategoryType
}

export class MaintenanceCategory extends ValueObject<MaintenanceCategoryProps> {
	private static ALLOWED_CATEGORIES: MaintenanceCategoryType[] = [
		'PLUMBING',
		'ELECTRICAL',
		'HVAC',
		'APPLIANCE',
		'STRUCTURAL',
		'PEST_CONTROL',
		'OTHER',
	]

	private constructor(props: MaintenanceCategoryProps) {
		super(props)
	}

	static create(category: string): MaintenanceCategory {
		if (
			!MaintenanceCategory.ALLOWED_CATEGORIES.includes(
				category as MaintenanceCategoryType,
			)
		) {
			throw new Error(`Invalid maintenance category: ${category}`)
		}
		return new MaintenanceCategory({
			value: category as MaintenanceCategoryType,
		})
	}

	get value(): MaintenanceCategoryType {
		return this.props.value
	}

	static values(): MaintenanceCategoryType[] {
		return MaintenanceCategory.ALLOWED_CATEGORIES
	}
}
