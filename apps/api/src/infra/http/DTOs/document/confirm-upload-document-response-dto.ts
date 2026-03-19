import { ApiProperty } from '@nestjs/swagger'
import { DocumentDTO } from './document-dto'

export class ConfirmUploadDocumentResponseDTO {
	@ApiProperty({
		type: DocumentDTO,
		description: 'Array of documents',
	})
	document: DocumentDTO
}
