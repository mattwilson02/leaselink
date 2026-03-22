import { ValueObject } from '@/core/entities/value-object'

export type MaintenancePriorityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'

interface MaintenancePriorityProps {
	value: MaintenancePriorityType
}

export class MaintenancePriority extends ValueObject<MaintenancePriorityProps> {
	// biome-ignore lint/style/useNamingConvention: CONSTANT_CASE for static readonly collection
	private static ALLOWED_PRIORITIES: MaintenancePriorityType[] = [
		'LOW',
		'MEDIUM',
		'HIGH',
		'EMERGENCY',
	]

	private constructor(props: MaintenancePriorityProps) {
		super(props)
	}

	static create(priority: string): MaintenancePriority {
		if (
			!MaintenancePriority.ALLOWED_PRIORITIES.includes(
				priority as MaintenancePriorityType,
			)
		) {
			throw new Error(`Invalid maintenance priority: ${priority}`)
		}
		return new MaintenancePriority({
			value: priority as MaintenancePriorityType,
		})
	}

	get value(): MaintenancePriorityType {
		return this.props.value
	}

	static values(): MaintenancePriorityType[] {
		return MaintenancePriority.ALLOWED_PRIORITIES
	}
}
