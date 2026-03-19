import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface DomainEvent {
	occurredAt: Date
	getAggregateId(): UniqueEntityId
}
