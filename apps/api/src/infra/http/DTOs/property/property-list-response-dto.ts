import { ApiProperty } from '@nestjs/swagger'
import { PropertyResponseDTO } from './property-response-dto'

export class PropertyListMetaDTO {
	@ApiProperty({ example: 1 })
	page: number

	@ApiProperty({ example: 20 })
	pageSize: number

	@ApiProperty({ example: 50 })
	totalCount: number

	@ApiProperty({ example: 3 })
	totalPages: number
}

export class PropertyListResponseDTO {
	@ApiProperty({ type: [PropertyResponseDTO] })
	data: PropertyResponseDTO[]

	@ApiProperty({ type: PropertyListMetaDTO })
	meta: PropertyListMetaDTO
}
