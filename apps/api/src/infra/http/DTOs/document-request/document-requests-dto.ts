import { ApiProperty } from '@nestjs/swagger'
import { DocumentRequestDTO } from './document-request-dto'

export class DocumentRequestsDto {
	@ApiProperty({
		type: [DocumentRequestDTO],
		description: 'Array of document requests',
	})
	documentRequests: DocumentRequestDTO[]
}
