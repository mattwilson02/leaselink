import { ApiProperty } from '@nestjs/swagger'

export class DeleteClientErrorDTO {
	@ApiProperty({
		example: 'An error occurred while deleting the client',
		description: 'Error message describing the issue',
	})
	message!: string

	@ApiProperty({
		example: 'BAD_REQUEST',
		description: 'Error code',
	})
	error!: string

	@ApiProperty({
		example: 400,
		description: 'HTTP status code',
	})
	statusCode!: number
}
