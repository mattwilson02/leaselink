import { HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class DownloadDocumentNotFoundDTO {
	@ApiProperty({
		example: 'Document not found',
		description: 'Error message',
	})
	message: string

	@ApiProperty({
		example: 'Not Found',
		description: 'Error type',
	})
	error: string

	@ApiProperty({
		example: HttpStatus.NOT_FOUND,
		description: 'HTTP status code',
	})
	statusCode: number
}
