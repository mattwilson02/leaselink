import { ApiProperty } from '@nestjs/swagger'

export class UpdatePropertyStatusRequestDTO {
	@ApiProperty({
		enum: ['VACANT', 'LISTED', 'OCCUPIED', 'MAINTENANCE'],
		example: 'LISTED',
	})
	status: string
}
