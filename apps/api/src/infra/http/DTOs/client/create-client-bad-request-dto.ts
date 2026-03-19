import { HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class CreateClientBadRequestDTO {
	@ApiProperty({
		example: 'Invalid email format',
		description: 'Error message',
	})
	message: string

	@ApiProperty({
		example: 'Bad Request',
		description: 'Error type',
	})
	error: string

	@ApiProperty({
		example: HttpStatus.BAD_REQUEST,
		description: 'HTTP status code',
	})
	statusCode: number
}
