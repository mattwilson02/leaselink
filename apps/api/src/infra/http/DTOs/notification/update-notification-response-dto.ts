import { ApiProperty } from '@nestjs/swagger'
import {
	NotificationType,
	ActionType,
} from '@/domain/notification/enterprise/entities/notification'

export class UpdateNotificationResponseDTO {
	@ApiProperty({
		example: 'notification-uuid',
		description: 'Notification unique identifier',
	})
	notificationId: string

	@ApiProperty({
		example: 'person-uuid',
		description: 'Person unique identifier',
	})
	personId: string

	@ApiProperty({
		example: 'Notification title',
		description: 'The notification title',
	})
	title: string

	@ApiProperty({
		example: 'Notification body',
		description: 'The notification body text',
	})
	body: string

	@ApiProperty({
		example: NotificationType.INFO,
		enum: NotificationType,
		description: 'Type of the notification',
	})
	notificationType: NotificationType

	@ApiProperty({
		example: ActionType.SIGN_DOCUMENT,
		enum: ActionType,
		description: 'Type of action required',
		nullable: true,
		required: false,
	})
	actionType?: ActionType | null

	@ApiProperty({
		example: 'document-uuid',
		description: 'Linked document ID',
		nullable: true,
		required: false,
	})
	linkedDocumentId?: string | null

	@ApiProperty({
		example: 'transaction-uuid',
		description: 'Linked transaction ID',
		nullable: true,
		required: false,
	})
	linkedTransactionId?: string | null

	@ApiProperty({
		example: true,
		description: 'Whether the notification has been read',
	})
	isRead: boolean

	@ApiProperty({
		example: false,
		description: 'Whether the action is complete',
	})
	isActionComplete: boolean

	@ApiProperty({
		example: '2024-05-26T12:34:56.789Z',
		description: 'Creation timestamp (ISO 8601)',
		type: String,
		format: 'date-time',
	})
	createdAt: string

	@ApiProperty({
		example: '2024-05-26T12:34:56.789Z',
		description: 'Last update timestamp (ISO 8601)',
		type: String,
		format: 'date-time',
		nullable: true,
	})
	updatedAt: string | null

	@ApiProperty({
		example: '2024-05-26T12:34:56.789Z',
		description: 'When a notification was archived',
		type: String,
		format: 'date-time',
		nullable: true,
	})
	archivedAt: string | null
}
