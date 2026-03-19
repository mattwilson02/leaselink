import { HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class RouteAllowedOnlyInDevDTO {
	@ApiProperty({
		example: 'This route is only available in development',
		description: 'Error message',
	})
	message: string

	@ApiProperty({
		example: HttpStatus.FORBIDDEN,
		description: 'HTTP status code',
	})
	statusCode: number
}
