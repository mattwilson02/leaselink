import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface PersonProps {
	email: string
	name: string
	createdAt: Date
	updatedAt?: Date | null
	deviceId?: UniqueEntityId | null
}

export abstract class Person<Props extends PersonProps> extends Entity<Props> {
	get email(): string {
		return this.props.email
	}
	set email(email: string) {
		this.props.email = email
		this.touch()
	}

	get name(): string {
		return this.props.name
	}
	set name(name: string) {
		this.props.name = name
		this.touch()
	}

	get createdAt(): Date {
		return this.props.createdAt
	}

	get updatedAt(): Date | undefined | null {
		return this.props.updatedAt
	}

	get deviceId(): UniqueEntityId | null {
		return this.props.deviceId || null
	}
	set deviceId(deviceId: UniqueEntityId | null) {
		this.props.deviceId = deviceId
		this.touch()
	}

	protected touch() {
		this.props.updatedAt = new Date()
	}
}
