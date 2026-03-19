import { type Either, right } from '@/core/either'

import { Injectable } from '@nestjs/common'
import {
	Notification,
	type ActionType,
	type NotificationType,
} from '../../enterprise/entities/notification'
import { NotificationRepository } from '../repositories/notification-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { PushNotificationRepository } from '../repositories/push-notification-repository'
import { ClientsRepository } from '@/domain/financial-management/application/repositories/clients-repository'

export interface CreateNotificationUseCaseRequest {
	personId: string
	text: string
	notificationType: NotificationType
	actionType?: ActionType
	linkedDocumentId?: string
	linkedTransactionId?: string
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
		})

		const client = await this.clientsRepository.findById(personId)

		await this.notificationsRepository.create(notification)

		if (client?.pushToken) {
			await this.pushNotificationsRepository.sendSingleNotification({
				token: client.pushToken,
				title: 'You have a new notification',
				// TODO: will we send the text or a custom message?
				body: '',
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
