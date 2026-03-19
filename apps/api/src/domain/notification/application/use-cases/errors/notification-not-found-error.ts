import { UseCaseError } from '@/core/errors/use-case-error'

export class NotificationNotFoundError extends Error implements UseCaseError {
	constructor(notificationId: string) {
		super(`Notification with ID: ${notificationId} not found.`)
	}
}
