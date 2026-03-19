import { AggregateRoot } from '@/core/entities/aggregate-root'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export enum NotificationType {
	INFO = 'INFO',
	ACTION = 'ACTION',
}

export enum ActionType {
	SIGN_DOCUMENT = 'SIGN_DOCUMENT',
	UPLOAD_DOCUMENT = 'UPLOAD_DOCUMENT',
	BASIC_COMPLETE = 'BASIC_COMPLETE',
	MAINTENANCE_UPDATE = 'MAINTENANCE_UPDATE',
	RENT_REMINDER = 'RENT_REMINDER',
	PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
	PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
	SIGN_LEASE = 'SIGN_LEASE',
	LEASE_EXPIRY = 'LEASE_EXPIRY',
	INSPECTION_SCHEDULED = 'INSPECTION_SCHEDULED',
	LEASE_RENEWAL = 'LEASE_RENEWAL',
}

export interface NotificationProps {
	personId: UniqueEntityId
	text: string
	body?: string
	notificationType: NotificationType
	actionType?: ActionType
	linkedDocumentId?: UniqueEntityId
	linkedTransactionId?: UniqueEntityId
	linkedPaymentId?: UniqueEntityId
	isRead: boolean
	isActionComplete: boolean
	createdAt: Date
	updatedAt?: Date | null
	archivedAt?: Date | null
}

export class Notification extends AggregateRoot<NotificationProps> {
	get archivedAt() {
		return this.props.archivedAt
	}

	set archivedAt(archivedAt: Date | null | undefined) {
		this.props.archivedAt = archivedAt
		this.touch()
	}

	get createdAt() {
		return this.props.createdAt
	}

	get updatedAt() {
		return this.props.updatedAt
	}

	get personId() {
		return this.props.personId
	}

	set personId(personId: UniqueEntityId) {
		this.props.personId = personId
		this.touch()
	}

	get text() {
		return this.props.text
	}

	set text(text: string) {
		this.props.text = text
		this.touch()
	}

	get body(): string | undefined {
		return this.props.body
	}

	set body(body: string) {
		this.props.body = body
		this.touch()
	}

	get notificationType() {
		return this.props.notificationType
	}

	set notificationType(notificationType: NotificationType) {
		this.props.notificationType = notificationType
		this.touch()
	}

	get actionType(): ActionType | undefined {
		return this.props.actionType
	}

	set actionType(actionType: ActionType) {
		this.props.actionType = actionType
		this.touch()
	}

	get linkedDocumentId(): UniqueEntityId | undefined {
		return this.props.linkedDocumentId
	}

	set linkedDocumentId(linkedDocumentId: UniqueEntityId) {
		this.props.linkedDocumentId = linkedDocumentId
		this.touch()
	}

	get linkedTransactionId(): UniqueEntityId | undefined {
		return this.props.linkedTransactionId
	}

	set linkedTransactionId(linkedTransactionId: UniqueEntityId) {
		this.props.linkedTransactionId = linkedTransactionId
		this.touch()
	}

	get linkedPaymentId(): UniqueEntityId | undefined {
		return this.props.linkedPaymentId
	}

	set linkedPaymentId(linkedPaymentId: UniqueEntityId) {
		this.props.linkedPaymentId = linkedPaymentId
		this.touch()
	}

	get isRead() {
		return this.props.isRead
	}

	set isRead(isRead: boolean) {
		this.props.isRead = isRead
		this.touch()
	}

	get isActionComplete() {
		return this.props.isActionComplete
	}

	set isActionComplete(isActionComplete: boolean) {
		this.props.isActionComplete = isActionComplete
		this.touch()
	}

	private touch() {
		this.props.updatedAt = new Date()
	}

	static create(
		props: Optional<
			NotificationProps,
			'createdAt' | 'isRead' | 'isActionComplete'
		>,
		id?: UniqueEntityId,
	) {
		const notification = new Notification(
			{
				...props,
				isRead: props?.isRead ?? false,
				isActionComplete: props?.isActionComplete ?? false,
				createdAt: props?.createdAt ?? new Date(),
				archivedAt: props?.archivedAt ?? null,
			},
			id,
		)

		return notification
	}
}
