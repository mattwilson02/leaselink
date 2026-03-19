import { AggregateRoot } from '@/core/entities/aggregate-root'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { DomainEvent } from '@/core/events/domain-event'
import { DomainEvents } from '@/core/events/domain-events'

class CustomAggregateCreated implements DomainEvent {
	public occurredAt: Date
	private aggregate: CustomAggregate

	constructor(aggregate: CustomAggregate) {
		this.aggregate = aggregate
		this.occurredAt = new Date()
	}

	public getAggregateId(): UniqueEntityId {
		return this.aggregate.id
	}
}

class CustomAggregate extends AggregateRoot<unknown> {
	static create() {
		const aggregate = new CustomAggregate(null)

		aggregate.addDomainEvent(new CustomAggregateCreated(aggregate))

		return aggregate
	}
}

describe('DomainEvents', () => {
	it('should dispatch events for marked aggregates', () => {
		const callbackSpy = vi.fn()
		DomainEvents.register(callbackSpy, CustomAggregateCreated.name)

		const aggregate = CustomAggregate.create()

		expect(aggregate.domainEvents).toHaveLength(1)

		DomainEvents.dispatchEventsForAggregate(aggregate.id)

		expect(callbackSpy).toHaveBeenCalledTimes(1)
		expect(aggregate.domainEvents).toHaveLength(0)
	})
})
