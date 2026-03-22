import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface AuditLogProps {
	actorId: UniqueEntityId
	actorType: string
	action: string
	resourceType: string
	resourceId: UniqueEntityId
	metadata: Record<string, unknown> | null
	createdAt: Date
}

export class AuditLog extends Entity<AuditLogProps> {
	get actorId() {
		return this.props.actorId
	}

	get actorType() {
		return this.props.actorType
	}

	get action() {
		return this.props.action
	}

	get resourceType() {
		return this.props.resourceType
	}

	get resourceId() {
		return this.props.resourceId
	}

	get metadata() {
		return this.props.metadata
	}

	get createdAt() {
		return this.props.createdAt
	}

	static create(
		props: Omit<AuditLogProps, 'createdAt'> & { createdAt?: Date },
		id?: UniqueEntityId,
	) {
		return new AuditLog(
			{
				...props,
				createdAt: props.createdAt ?? new Date(),
			},
			id,
		)
	}
}
