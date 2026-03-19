import { ApiProperty } from '@nestjs/swagger'

export class ClientNotFoundDTO {
	@ApiProperty({
		example: 'Resource not found',
		description: 'Error message indicating client was not found',
	})
	message!: string

	@ApiProperty({
		example: 'NOT_FOUND',
		description: 'Error code',
	})
	error!: string

	@ApiProperty({
		example: 404,
		description: 'HTTP status code',
	})
	statusCode!: number
}
