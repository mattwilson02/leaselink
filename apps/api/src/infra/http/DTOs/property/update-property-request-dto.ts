import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdatePropertyRequestDTO {
	@ApiPropertyOptional({ example: '456 Oak Ave' })
	address?: string

	@ApiPropertyOptional({ example: 'Los Angeles' })
	city?: string

	@ApiPropertyOptional({ example: 'CA' })
	state?: string

	@ApiPropertyOptional({ example: '90001' })
	zipCode?: string

	@ApiPropertyOptional({
		enum: ['APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'STUDIO'],
		example: 'APARTMENT',
	})
	propertyType?: string

	@ApiPropertyOptional({ example: 3 })
	bedrooms?: number

	@ApiPropertyOptional({ example: 2 })
	bathrooms?: number

	@ApiPropertyOptional({ example: 1500, nullable: true })
	sqft?: number | null

	@ApiPropertyOptional({ example: 3000 })
	rentAmount?: number

	@ApiPropertyOptional({
		example: 'Updated description',
		nullable: true,
	})
	description?: string | null
}
