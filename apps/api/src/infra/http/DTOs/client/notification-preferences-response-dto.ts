import { ApiProperty } from '@nestjs/swagger'

export class NotificationPreferencesResponseDTO {
	@ApiProperty({
		example: true,
		description: 'Whether the client is set to receive email notifications',
	})
	receivesEmailNotifications: boolean

	@ApiProperty({
		example: true,
		description: 'Whether the client is set to receive push notifications',
	})
	receivesPushNotifications: boolean

	@ApiProperty({
		example: true,
		description:
			'Whether the client is set to receive notifications about portfolio updates',
	})
	receivesNotificationsForPortfolio: boolean

	@ApiProperty({
		example: true,
		description:
			'Whether the client is set to receive notifications about new documents',
	})
	receivesNotificationsForDocuments: boolean
}
