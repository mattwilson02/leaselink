import { ValueObject } from '@/core/entities/value-object'

export type AuthUserTypeProps = {
	value: 'CLIENT' | 'EMPLOYEE'
}

export class AuthUserType extends ValueObject<AuthUserTypeProps> {
	get value() {
		return this.props.value
	}

	static create(props: AuthUserTypeProps) {
		return new AuthUserType(props)
	}
}
