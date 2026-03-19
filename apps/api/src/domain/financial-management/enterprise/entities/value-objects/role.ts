import { ValueObject } from '@/core/entities/value-object'

export type RoleType = 'ADMIN' | 'SUPPORT'

interface RoleProps {
	value: RoleType
}

export class Role extends ValueObject<RoleProps> {
	// biome-ignore lint/style/useNamingConvention: <We want upper case for this constant>
	private static ALLOWED_ROLES: RoleType[] = ['ADMIN', 'SUPPORT']

	private constructor(props: RoleProps) {
		super(props)
	}

	static create(role: string): Role {
		if (!Role.ALLOWED_ROLES.includes(role as RoleType)) {
			throw new Error(`Invalid role value: ${role}`)
		}
		return new Role({ value: role as RoleType })
	}

	get value(): RoleType {
		return this.props.value
	}

	static values(): RoleType[] {
		return Role.ALLOWED_ROLES
	}

	static isValidRole(role: string): boolean {
		return Role.ALLOWED_ROLES.includes(role as RoleType)
	}
}
