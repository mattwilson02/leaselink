import { ApiProperty } from '@nestjs/swagger'

export class UploadDocumentResponseDTO {
	@ApiProperty({
		description: 'The URL to upload the document to',
		example: 'https://example.com/upload-url',
		required: true,
		nullable: false,
	})
	uploadUrl: string
}
