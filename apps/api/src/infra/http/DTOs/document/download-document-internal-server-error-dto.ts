import { HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class DownloadDocumentInternalServerErrorDTO {
	@ApiProperty({
		example: 'An unexpected error occurred',
		description: 'Error message',
	})
	message: string

	@ApiProperty({
		example: 'Internal Server Error',
		description: 'Error type',
	})
	error: string

	@ApiProperty({
		example: HttpStatus.INTERNAL_SERVER_ERROR,
		description: 'HTTP status code',
	})
	statusCode: number
}
