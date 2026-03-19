import { ApiProperty } from '@nestjs/swagger'

export class SetNotificationPreferencesRequestDTO {
	@ApiProperty({
		example: true,
		description: 'Whether the client wants to receive email notifications',
		required: false,
	})
	receivesEmailNotifications?: boolean

	@ApiProperty({
		example: true,
		description: 'Whether the client wants to receive push notifications',
		required: false,
	})
	receivesPushNotifications?: boolean

	@ApiProperty({
		example: true,
		description:
			'Whether the client wants to receive notifications about portfolio updates',
		required: false,
	})
	receivesNotificationsForPortfolio?: boolean

	@ApiProperty({
		example: true,
		description:
			'Whether the client wants to receive notifications about new documents',
		required: false,
	})
	receivesNotificationsForDocuments?: boolean
}
