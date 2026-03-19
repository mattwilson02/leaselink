import { NotificationRepository } from '@/domain/notification/application/repositories/notification-repository'
import {
	Notification,
	ActionType,
	NotificationType,
} from '../../enterprise/entities/notification'
import { right, left, type Either } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { NotificationNotFoundError } from './errors/notification-not-found-error'
import { NotificationActionIncompleteError } from './errors/notification-action-incomplete-error'
import { NotificationActionCantBeCompletedError } from './errors/notification-action-cant-be-completed-error'

interface UpdateNotificationUseCaseRequest {
	notificationId: string
	isRead?: boolean
	isActionComplete?: boolean
	isArchived?: boolean
}

type UpdateNotificationUseCaseResponse = Either<
	NotificationNotFoundError | NotificationActionIncompleteError,
	{ notification: Notification }
>

@Injectable()
export class UpdateNotificationUseCase {
	constructor(private notificationRepository: NotificationRepository) {}

	async execute(
		request: UpdateNotificationUseCaseRequest,
	): Promise<UpdateNotificationUseCaseResponse> {
		const { notificationId, isRead, isActionComplete, isArchived } = request

		const notification =
			await this.notificationRepository.findById(notificationId)

		if (!notification) {
			return left(new NotificationNotFoundError(notificationId))
		}

		if (isRead !== undefined) {
			notification.isRead = isRead
		}

		if (isArchived !== undefined) {
			const isActionNotComplete =
				notification.notificationType === NotificationType.ACTION &&
				!notification.isActionComplete

			if (isActionNotComplete) {
				return left(new NotificationActionIncompleteError(notificationId))
			}
			notification.archivedAt = isArchived ? new Date() : null
		}

		if (isActionComplete !== undefined) {
			if (notification.actionType !== ActionType.BASIC_COMPLETE) {
				return left(new NotificationActionCantBeCompletedError())
			}
			notification.isActionComplete = isActionComplete
		}

		await this.notificationRepository.save(notification)

		return right({ notification })
	}
}
