import { Notification } from '@/domain/notification/enterprise/entities/notification'
import { UpdateNotificationResponseDTO } from '../DTOs/notification/update-notification-response-dto'

export class HttpNotificationSinglePresenter {
	static toHTTP(notification: Notification): UpdateNotificationResponseDTO {
		return {
			notificationId: notification.id.toString(),
			personId: notification.personId.toString(),
			title: notification.text,
			body: notification.body || '',
			notificationType: notification.notificationType,
			actionType: notification.actionType ?? null,
			linkedDocumentId: notification.linkedDocumentId?.toString() ?? null,
			linkedTransactionId: notification.linkedTransactionId?.toString() ?? null,
			isRead: notification.isRead,
			isActionComplete: notification.isActionComplete,
			createdAt: notification.createdAt
				? notification.createdAt instanceof Date
					? notification.createdAt.toISOString()
					: notification.createdAt
				: '',
			updatedAt: notification.updatedAt
				? notification.updatedAt instanceof Date
					? notification.updatedAt.toISOString()
					: notification.updatedAt
				: null,
			archivedAt: notification.archivedAt
				? notification.archivedAt instanceof Date
					? notification.archivedAt.toISOString()
					: notification.archivedAt
				: null,
		}
	}
}
