import {
	NotificationMessage,
	PushNotificationRepository,
} from '@/domain/notification/application/repositories/push-notification-repository'

export class InMemoryPushNotificationsRepository
	implements PushNotificationRepository
{
	public items: NotificationMessage[] = []

	async sendSingleNotification(message: NotificationMessage) {
		this.items.push(message)
		return [
			{
				status: 'ok',
			},
		]
	}

	validateToken(token: string): boolean {
		return token.startsWith('ExponentPushToken[') && token.endsWith(']')
	}
}
