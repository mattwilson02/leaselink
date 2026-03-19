import { ApiProperty } from '@nestjs/swagger'

export class MarkAllNotificationsAsReadRequestDTO {
	@ApiProperty({
		example: 'a37bf2c9-9f1f-4eea-924b-4d6617cd5aff',
		description:
			'Unique identifier of the person associated with the notification',
	})
	personId: string
}
