import { ApiProperty } from '@nestjs/swagger'
import { DocumentDTO } from '../document/document-dto'

export class GetDocumentsByClientIdResponseDTO {
	@ApiProperty({
		type: [DocumentDTO],
		description: 'Array of documents',
	})
	documents: DocumentDTO[]
}
