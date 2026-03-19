import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class PropertyResponseDTO {
	@ApiProperty({ example: 'uuid-1234' })
	id: string

	@ApiProperty({ example: 'uuid-manager' })
	managerId: string

	@ApiProperty({ example: '123 Main St' })
	address: string

	@ApiProperty({ example: 'New York' })
	city: string

	@ApiProperty({ example: 'NY' })
	state: string

	@ApiProperty({ example: '10001' })
	zipCode: string

	@ApiProperty({ example: 'APARTMENT' })
	propertyType: string

	@ApiProperty({ example: 2 })
	bedrooms: number

	@ApiProperty({ example: 1.5 })
	bathrooms: number

	@ApiPropertyOptional({ example: 1200, nullable: true })
	sqft: number | null

	@ApiProperty({ example: 2500 })
	rentAmount: number

	@ApiProperty({ example: 'VACANT' })
	status: string

	@ApiPropertyOptional({ nullable: true })
	description: string | null

	@ApiProperty({ type: [String] })
	photos: string[]

	@ApiProperty()
	createdAt: string

	@ApiPropertyOptional({ nullable: true })
	updatedAt: string | null
}
