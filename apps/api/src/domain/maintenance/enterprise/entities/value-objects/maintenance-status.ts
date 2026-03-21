import { ValueObject } from '@/core/entities/value-object'

export type MaintenanceStatusType =
	| 'OPEN'
	| 'IN_PROGRESS'
	| 'RESOLVED'
	| 'CLOSED'

interface MaintenanceStatusProps {
	value: MaintenanceStatusType
}

export class MaintenanceStatus extends ValueObject<MaintenanceStatusProps> {
	// biome-ignore lint/style/useNamingConvention: CONSTANT_CASE for static readonly collection
	private static ALLOWED_STATUSES: MaintenanceStatusType[] = [
		'OPEN',
		'IN_PROGRESS',
		'RESOLVED',
		'CLOSED',
	]

	private constructor(props: MaintenanceStatusProps) {
		super(props)
	}

	static create(status: string): MaintenanceStatus {
		if (
			!MaintenanceStatus.ALLOWED_STATUSES.includes(
				status as MaintenanceStatusType,
			)
		) {
			throw new Error(`Invalid maintenance status: ${status}`)
		}
		return new MaintenanceStatus({ value: status as MaintenanceStatusType })
	}

	get value(): MaintenanceStatusType {
		return this.props.value
	}

	static values(): MaintenanceStatusType[] {
		return MaintenanceStatus.ALLOWED_STATUSES
	}
}
