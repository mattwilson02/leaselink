import { HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class ClientAlreadyExistsDTO {
	@ApiProperty({
		example: 'Client already exists with this email',
		description: 'Error message',
	})
	message: string

	@ApiProperty({
		example: 'Conflict',
		description: 'Error type',
	})
	error: string

	@ApiProperty({
		example: HttpStatus.CONFLICT,
		description: 'HTTP status code',
	})
	statusCode: number
}
