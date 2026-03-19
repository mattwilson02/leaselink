import { ApiProperty } from '@nestjs/swagger'

export class UpdateNotificationRequestDTO {
	@ApiProperty({
		example: true,
		description: 'Whether the notification has been read',
		required: false,
		nullable: true,
	})
	isRead?: boolean

	@ApiProperty({
		example: false,
		description: 'Whether the action is complete',
		required: false,
		nullable: true,
	})
	isActionComplete?: boolean

	@ApiProperty({
		example: true,
		description: 'Whether a notification should be archived',
		nullable: true,
		required: false,
	})
	isArchived?: boolean
}
