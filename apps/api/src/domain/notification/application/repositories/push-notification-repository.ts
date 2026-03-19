export interface PushToken {
	token: string
	userId?: string
	createdAt: Date
}

export interface NotificationMessage {
	token: string
	title: string
	body: string
	// biome-ignore lint/suspicious/noExplicitAny: Expo metadata can be any type
	data?: Record<string, any>
}

export interface BroadcastMessage {
	title: string
	body: string
	// biome-ignore lint/suspicious/noExplicitAny: Expo metadata can be any type
	data?: Record<string, any>
}

export abstract class PushNotificationRepository {
	abstract sendSingleNotification(
		message: NotificationMessage,
	): Promise<{ status: string }[]>
	abstract validateToken(token: string): boolean
}
