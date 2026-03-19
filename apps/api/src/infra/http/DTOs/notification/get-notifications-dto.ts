import { ApiProperty } from '@nestjs/swagger'

export class GetNotificationsDTO {
	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174000',
		description: 'Unique identifier of the notification',
	})
	id: string

	@ApiProperty({
		example: 'a37bf2c9-9f1f-4eea-924b-4d6617cd5aff',
		description:
			'Unique identifier of the person associated with the notification',
	})
	personId: string

	@ApiProperty({
		example: 'Notification text',
		description: 'Text of the notification',
	})
	text: string

	@ApiProperty({
		example: 'INFO',
		description: 'Type of the notification',
		enum: ['INFO', 'ACTION'],
	})
	notificationType: string

	@ApiProperty({
		example: 'SIGN_DOCUMENT',
		description: 'Type of action associated with the notification (if any)',
		enum: ['SIGN_DOCUMENT', 'UPLOAD_DOCUMENT', 'BASIC_COMPLETE'],
		nullable: true,
	})
	actionType: string | null

	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174002',
		description: 'Unique identifier of the linked document (if any)',
		nullable: true,
		type: String,
		format: 'uuid',
	})
	linkedDocumentId: string | null

	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174003',
		description: 'Unique identifier of the linked transaction (if any)',
		nullable: true,
		type: String,
		format: 'uuid',
	})
	linkedTransactionId: string | null

	@ApiProperty({
		example: false,
		description: 'Indicates whether the notification has been read',
	})
	isRead: boolean

	@ApiProperty({
		example: false,
		description:
			'Indicates whether the action associated with the notification is complete',
	})
	isActionComplete: boolean

	@ApiProperty({
		example: '2025-03-17T11:35:15.461Z',
		description: 'Date and time when the notification was created',
		type: String,
		format: 'date-time',
	})
	createdAt: string

	@ApiProperty({
		example: '2025-03-17T11:35:15.461Z',
		description: 'Date and time when the notification was last updated',
		nullable: true,
		type: String,
		format: 'date-time',
	})
	updatedAt: string | null

	@ApiProperty({
		example: '2025-03-17T11:35:15.461Z',
		description: 'Date and time when the notification was archived',
		nullable: true,
		type: String,
		format: 'date-time',
	})
	archivedAt: string | null
}
