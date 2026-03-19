import { HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class GetDocumentRequestByIdNotFoundDTO {
	@ApiProperty({
		example: 'Document request not found',
		description: 'Error message indicating the document request was not found',
	})
	message: string

	@ApiProperty({
		example: 'Not Found',
		description: 'Error type indicating the resource was not found',
	})
	error: string

	@ApiProperty({
		example: HttpStatus.NOT_FOUND,
		description: 'HTTP status code for not found',
	})
	statusCode: number
}
