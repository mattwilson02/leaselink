import { HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class OnlyEmployeesCanCreateDocumentRequestsDTO {
	@ApiProperty({
		example: 'Only employees can create document requests',
		description: 'Error message',
	})
	message: string

	@ApiProperty({
		example: 'Unauthorized',
		description: 'Error type',
	})
	error: string

	@ApiProperty({
		example: HttpStatus.UNAUTHORIZED,
		description: 'HTTP status code',
	})
	statusCode: number
}
