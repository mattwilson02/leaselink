import { HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateNotificationNotFoundDTO {
	@ApiProperty({
		example: 'Notification not found',
		description: 'Error message indicating the notification was not found',
		type: String,
	})
	message: string

	@ApiProperty({
		example: 'Not Found',
		description: 'Error type indicating the resource was not found',
		type: String,
	})
	error: string

	@ApiProperty({
		example: HttpStatus.NOT_FOUND,
		description: 'HTTP status code for not found',
		type: Number,
	})
	statusCode: number
}
