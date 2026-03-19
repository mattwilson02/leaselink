import { ValueObject } from '@/core/entities/value-object'

export type ClientStatusType = 'INVITED' | 'ACTIVE' | 'INACTIVE'

interface ClientStatusProps {
	value: ClientStatusType
}

export class ClientStatus extends ValueObject<ClientStatusProps> {
	// biome-ignore lint/style/useNamingConvention: <We want upper case for this constant>
	private static ALLOWED_STATUSES: ClientStatusType[] = [
		'INVITED',
		'ACTIVE',
		'INACTIVE',
	]

	private constructor(props: ClientStatusProps) {
		super(props)
	}

	static create(status: string): ClientStatus {
		if (!ClientStatus.ALLOWED_STATUSES.includes(status as ClientStatusType)) {
			throw new Error(`Invalid client status: ${status}`)
		}
		return new ClientStatus({ value: status as ClientStatusType })
	}

	get value(): ClientStatusType {
		return this.props.value
	}

	static values(): ClientStatusType[] {
		return ClientStatus.ALLOWED_STATUSES
	}

	static isValidStatus(status: string): boolean {
		return ClientStatus.ALLOWED_STATUSES.includes(status as ClientStatusType)
	}

	isActive(): boolean {
		return this.props.value === 'ACTIVE'
	}

	isInactive(): boolean {
		return this.props.value === 'INACTIVE'
	}

	isInvited(): boolean {
		return this.props.value === 'INVITED'
	}
}
