import { ApiProperty } from '@nestjs/swagger'
import { DocumentDTO } from './document-dto'

export class GetDocumentWithDownloadUrlResponseDTO extends DocumentDTO {
	@ApiProperty({
		example: 'https://example.com/thumbnail/document-thumbnail.jpg',
		description: 'Link to the thumbnail of the document',
		nullable: true,
	})
	thumbnailDownloadUrl: string | null
}
