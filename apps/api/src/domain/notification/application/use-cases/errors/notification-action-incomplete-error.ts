import { UseCaseError } from '@/core/errors/use-case-error'

export class NotificationActionIncompleteError
	extends Error
	implements UseCaseError
{
	constructor(notificationId: string) {
		super(
			`Notification with ID: ${notificationId} action is not complete and cannot be archived.`,
		)
	}
}
