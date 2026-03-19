import { ApiProperty } from '@nestjs/swagger'

export class OnlyEmployeesCanDeleteClientDTO {
	@ApiProperty({
		example: 'Only employees can delete clients',
		description: 'Error message indicating authorization issue',
	})
	message!: string

	@ApiProperty({
		example: 'UNAUTHORIZED',
		description: 'Error code',
	})
	error!: string

	@ApiProperty({
		example: 401,
		description: 'HTTP status code',
	})
	statusCode!: number
}
