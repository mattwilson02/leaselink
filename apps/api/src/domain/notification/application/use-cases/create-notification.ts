import { type Either, right } from '@/core/either'

import { Injectable } from '@nestjs/common'
import {
	ActionType,
	Notification,
	type NotificationType,
} from '../../enterprise/entities/notification'
import { NotificationRepository } from '../repositories/notification-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { PushNotificationRepository } from '../repositories/push-notification-repository'
import { ClientsRepository } from '@/domain/financial-management/application/repositories/clients-repository'

const ACTION_TYPE_PUSH_TITLES: Record<ActionType, string> = {
	[ActionType.MAINTENANCE_UPDATE]: 'Maintenance Update',
	[ActionType.RENT_REMINDER]: 'Rent Reminder',
	[ActionType.PAYMENT_RECEIVED]: 'Payment Received',
	[ActionType.PAYMENT_OVERDUE]: 'Payment Overdue',
	[ActionType.UPLOAD_DOCUMENT]: 'Document Requested',
	[ActionType.SIGN_DOCUMENT]: 'Document Ready to Sign',
	[ActionType.SIGN_LEASE]: 'New Lease Available',
	[ActionType.LEASE_EXPIRY]: 'Lease Expiring Soon',
	[ActionType.LEASE_RENEWAL]: 'Lease Renewal Available',
	[ActionType.INSPECTION_SCHEDULED]: 'Inspection Scheduled',
	[ActionType.BASIC_COMPLETE]: 'LeaseLink Notification',
}

export interface CreateNotificationUseCaseRequest {
	personId: string
	text: string
	notificationType: NotificationType
	actionType?: ActionType
	linkedDocumentId?: string
	linkedTransactionId?: string
	linkedPaymentId?: string
}

type CreateNotificationUseCaseResponse = Either<
	Error,
	{
		notification: Notification
	}
>

@Injectable()
export class CreateNotificationUseCase {
	constructor(
		private notificationsRepository: NotificationRepository,
		private clientsRepository: ClientsRepository,
		private pushNotificationsRepository: PushNotificationRepository,
	) {}

	async execute({
		personId,
		text,
		notificationType,
		actionType,
		linkedDocumentId,
		linkedTransactionId,
		linkedPaymentId,
	}: CreateNotificationUseCaseRequest): Promise<CreateNotificationUseCaseResponse> {
		const notification = Notification.create({
			personId: new UniqueEntityId(personId),
			text,
			notificationType,
			actionType,
			linkedDocumentId: linkedDocumentId
				? new UniqueEntityId(linkedDocumentId)
				: undefined,
			linkedTransactionId: linkedTransactionId
				? new UniqueEntityId(linkedTransactionId)
				: undefined,
			linkedPaymentId: linkedPaymentId
				? new UniqueEntityId(linkedPaymentId)
				: undefined,
		})

		const client = await this.clientsRepository.findById(personId)

		await this.notificationsRepository.create(notification)

		if (client?.pushToken) {
			const pushTitle = actionType
				? (ACTION_TYPE_PUSH_TITLES[actionType] ?? 'LeaseLink Notification')
				: 'LeaseLink Notification'
			await this.pushNotificationsRepository.sendSingleNotification({
				token: client.pushToken,
				title: pushTitle,
				body: text,
				data: {
					notificationId: notification.id.toString(),
				},
			})
		}

		return right({
			notification: notification,
		})
	}
}
