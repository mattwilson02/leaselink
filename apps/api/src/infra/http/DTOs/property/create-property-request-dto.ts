import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreatePropertyRequestDTO {
	@ApiProperty({ example: '123 Main St' })
	address: string

	@ApiProperty({ example: 'New York' })
	city: string

	@ApiProperty({ example: 'NY' })
	state: string

	@ApiProperty({ example: '10001' })
	zipCode: string

	@ApiProperty({
		enum: ['APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'STUDIO'],
		example: 'APARTMENT',
	})
	propertyType: string

	@ApiProperty({ example: 2 })
	bedrooms: number

	@ApiProperty({ example: 1.5 })
	bathrooms: number

	@ApiPropertyOptional({ example: 1200 })
	sqft?: number

	@ApiProperty({ example: 2500 })
	rentAmount: number

	@ApiPropertyOptional({
		example: 'Spacious 2BR apartment with city views',
	})
	description?: string
}
