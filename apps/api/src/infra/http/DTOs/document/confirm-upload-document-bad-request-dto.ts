import { HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class ConfirmUploadDocumentBadRequestDTO {
	@ApiProperty({
		description: 'Error message',
		example: 'Invalid document request ID',
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
