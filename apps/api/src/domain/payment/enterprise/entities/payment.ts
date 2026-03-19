import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import {
	PaymentStatus,
	PaymentStatusType,
} from './value-objects/payment-status'

export interface PaymentProps {
	leaseId: UniqueEntityId
	tenantId: UniqueEntityId
	amount: number
	dueDate: Date
	status: PaymentStatus
	stripeCheckoutSessionId: string | null
	stripePaymentIntentId: string | null
	paidAt: Date | null
	createdAt: Date
	updatedAt: Date | null
}

export class Payment extends Entity<PaymentProps> {
	get leaseId(): UniqueEntityId {
		return this.props.leaseId
	}

	get tenantId(): UniqueEntityId {
		return this.props.tenantId
	}

	get amount(): number {
		return this.props.amount
	}

	set amount(amount: number) {
		this.props.amount = amount
		this.touch()
	}

	get dueDate(): Date {
		return this.props.dueDate
	}

	get status(): PaymentStatusType {
		return this.props.status.value
	}

	set status(value: PaymentStatusType) {
		this.props.status = PaymentStatus.create(value)
		this.touch()
	}

	get stripeCheckoutSessionId(): string | null {
		return this.props.stripeCheckoutSessionId
	}

	set stripeCheckoutSessionId(id: string | null) {
		this.props.stripeCheckoutSessionId = id
		this.touch()
	}

	get stripePaymentIntentId(): string | null {
		return this.props.stripePaymentIntentId
	}

	set stripePaymentIntentId(id: string | null) {
		this.props.stripePaymentIntentId = id
		this.touch()
	}

	get paidAt(): Date | null {
		return this.props.paidAt
	}

	set paidAt(date: Date | null) {
		this.props.paidAt = date
		this.touch()
	}

	get createdAt(): Date {
		return this.props.createdAt
	}

	get updatedAt(): Date | null {
		return this.props.updatedAt
	}

	private touch() {
		this.props.updatedAt = new Date()
	}

	static create(
		props: Optional<
			PaymentProps,
			| 'createdAt'
			| 'updatedAt'
			| 'stripeCheckoutSessionId'
			| 'stripePaymentIntentId'
			| 'paidAt'
		>,
		id?: UniqueEntityId,
	): Payment {
		return new Payment(
			{
				...props,
				status:
					props.status instanceof PaymentStatus
						? props.status
						: PaymentStatus.create(props.status ?? 'UPCOMING'),
				stripeCheckoutSessionId: props.stripeCheckoutSessionId ?? null,
				stripePaymentIntentId: props.stripePaymentIntentId ?? null,
				paidAt: props.paidAt ?? null,
				createdAt: props.createdAt ?? new Date(),
				updatedAt: props.updatedAt ?? null,
			},
			id,
		)
	}
}
