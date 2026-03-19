import { ApiProperty } from '@nestjs/swagger'

export class MarkAllNotificationsAsReadResponseDTO {
	@ApiProperty({
		example: 5,
		description: 'Number of notifications marked as read',
	})
	count: number
}
