import {
	Notification,
	NotificationType,
} from '../../enterprise/entities/notification'

export interface UpdateManyByPersonIdParams {
	personId: string
	condition: { isRead?: boolean }
	updates: Partial<Notification>
}

export abstract class NotificationRepository {
	abstract create(notification: Notification): Promise<void>
	abstract getManyByPersonId(
		personId: string,
		offset: number,
		limit: number,
		notificationType?: NotificationType,
		isArchived?: boolean,
	): Promise<Notification[]>
	abstract findById(notificationId: string): Promise<Notification | null>
	abstract save(notification: Notification): Promise<void>
	abstract hasUnreadNotifications(personId: string): Promise<boolean>
	abstract updateManyByPersonId(
		params: UpdateManyByPersonIdParams,
	): Promise<number>
}
