import { UseCaseError } from '@/core/errors/use-case-error'

export class NotificationActionCantBeCompletedError
	extends Error
	implements UseCaseError
{
	constructor() {
		super('isActionComplete can only be updated for BASIC_COMPLETE action type')
	}
}
