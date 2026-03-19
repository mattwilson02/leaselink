import { ApiProperty } from '@nestjs/swagger'

export class CreateClientRequestDTO {
	@ApiProperty({
		example: 'John Doe',
		description: 'Client full name',
	})
	name: string

	@ApiProperty({
		example: 'john.doe@example.com',
		description: 'Client email address',
	})
	email: string

	@ApiProperty({
		example: '+442056174552',
		description: 'Client phone number in E.164 format',
	})
	phoneNumber: string
}
