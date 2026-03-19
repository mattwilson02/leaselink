import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface UserAuthProps {
	email: string
	password?: string
	phoneNumber: string
	name: string
}

export class UserAuth extends Entity<UserAuthProps> {
	get email() {
		return this.props.email
	}

	get name() {
		return this.props.name
	}

	get password() {
		return this.props.password
	}

	get phoneNumber() {
		return this.props.phoneNumber
	}

	static create(props: UserAuthProps, id?: UniqueEntityId) {
		const userAuth = new UserAuth(props, id)

		return userAuth
	}
}
