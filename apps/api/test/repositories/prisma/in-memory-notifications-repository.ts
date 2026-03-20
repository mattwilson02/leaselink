import type {
	ExistsByActionTypeAndLinkedIdParams,
	NotificationRepository,
	UpdateManyByPersonIdParams,
} from '@/domain/notification/application/repositories/notification-repository'
import type {
	Notification,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'

export class InMemoryNotificationsRepository implements NotificationRepository {
	public items: Notification[] = []

	updateManyByPersonId(params: UpdateManyByPersonIdParams): Promise<number> {
		const { personId, condition, updates } = params

		let count = 0

		for (const item of this.items) {
			if (
				item.personId.toString() === personId &&
				(item.isRead === condition.isRead || condition.isRead === undefined)
			) {
				Object.assign(item, updates)
				count++
			}
		}

		return Promise.resolve(count)
	}

	async create(notification: Notification): Promise<void> {
		this.items.push(notification)
	}

	async getManyByPersonId(
		personId: string,
		offset: number,
		limit: number,
		notificationType?: NotificationType,
	): Promise<Notification[]> {
		let notifications = this.items
			.filter((notification) => notification.personId.toString() === personId)
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
		if (notificationType) {
			notifications = notifications.filter(
				(notification) => notification.notificationType === notificationType,
			)
		}
		return notifications.slice(offset, offset + limit)
	}

	async findById(notificationId: string): Promise<Notification | null> {
		const notification = this.items.find(
			(notification) => notification.id.toString() === notificationId,
		)
		return notification ?? null
	}

	async save(notification: Notification): Promise<void> {
		const index = this.items.findIndex(
			(item) => item.id.toString() === notification.id.toString(),
		)
		if (index !== -1) {
			this.items[index] = notification
		}
	}

	async hasUnreadNotifications(personId: string): Promise<boolean> {
		const notifications = this.items.filter(
			(notification) =>
				notification.personId.toString() === personId && !notification.isRead,
		)
		return notifications.length > 0
	}

	async existsByActionTypeAndLinkedId(
		params: ExistsByActionTypeAndLinkedIdParams,
	): Promise<boolean> {
		return this.items.some(
			(n) =>
				n.actionType === params.actionType &&
				n.personId.toString() === params.personId &&
				n.createdAt >= params.createdAfter &&
				(!params.linkedTransactionId ||
					n.linkedTransactionId?.toString() === params.linkedTransactionId) &&
				(!params.linkedPaymentId ||
					n.linkedPaymentId?.toString() === params.linkedPaymentId),
		)
	}
}
