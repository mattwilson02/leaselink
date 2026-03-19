import { DomainEvent } from '../events/domain-event'
import { DomainEvents } from '../events/domain-events'
import { Entity } from './entity'

export abstract class AggregateRoot<Props> extends Entity<Props> {
	private domainEventsQueue: DomainEvent[] = []

	get domainEvents(): DomainEvent[] {
		return this.domainEventsQueue
	}

	protected addDomainEvent(domainEvent: DomainEvent): void {
		this.domainEventsQueue.push(domainEvent)
		DomainEvents.markAggregateForDispatch(this)
	}

	public clearEvents(): void {
		this.domainEventsQueue = []
	}
}
