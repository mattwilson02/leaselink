import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

interface SessionProps {
	authUserId: string
	token: string
}

export class Session extends Entity<SessionProps> {
	get authUserId() {
		return this.props.authUserId
	}

	get token() {
		return this.props.token
	}

	static create(props: SessionProps, id?: UniqueEntityId) {
		return new Session(
			{
				...props,
			},
			id,
		)
	}
}
