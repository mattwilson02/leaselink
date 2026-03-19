import { HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class GetMeUnauthorizedDTO {
	@ApiProperty({
		example: 'Unauthorized',
		description: 'Error message',
	})
	message: string

	@ApiProperty({
		example: HttpStatus.UNAUTHORIZED,
		description: 'HTTP status code',
	})
	statusCode: number
}
