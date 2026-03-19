import { HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateNotificationUnprocessableEntityDTO {
	@ApiProperty({
		example: 'Notification action is incomplete or cannot be completed',
		description: 'Error message indicating the notification action issue',
		type: String,
	})
	message: string

	@ApiProperty({
		example: 'Unprocessable Entity',
		description: 'Error type indicating the request could not be processed',
		type: String,
	})
	error: string

	@ApiProperty({
		example: HttpStatus.UNPROCESSABLE_ENTITY,
		description: 'HTTP status code for unprocessable entity',
		type: Number,
	})
	statusCode: number
}
