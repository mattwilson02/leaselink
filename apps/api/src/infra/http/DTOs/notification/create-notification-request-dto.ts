import {
	ActionType,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'
import { ApiProperty } from '@nestjs/swagger'

export class CreateNotificationRequestDTO {
	@ApiProperty({
		example: 'a37bf2c9-9f1f-4eea-924b-4d6617cd5aff',
		description: 'Client full name',
	})
	personId: string

	@ApiProperty({
		example: `You've got a new notification!`,
		description: 'Client email address',
	})
	text: string

	@ApiProperty({
		example: 'INFO',
		description: `The type of notification: [${Object.values(NotificationType).join(' / ')}]`,
	})
	notificationType: NotificationType

	@ApiProperty({
		example: 'SIGN_DOCUMENT',
		description: `Action type of the notification: [${Object.values(ActionType).join(' / ')}]`,
	})
	actionType?: ActionType

	@ApiProperty({
		example: 'A6A75036-9D35-44FA-B631-5DB51E94D3C6',
		description: 'Linked document ID of the notification',
	})
	linkedDocumentId?: string

	@ApiProperty({
		example: 'A6A75036-9D35-44FA-B631-5DB51E94D3C6',
		description: 'Linked transaction ID of the notification',
	})
	linkedTransactionId?: string
}
