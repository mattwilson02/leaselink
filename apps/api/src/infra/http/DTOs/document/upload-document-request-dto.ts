import { ApiProperty } from '@nestjs/swagger'

export class UploadDocumentRequestDTO {
	@ApiProperty({
		description: 'ID of the document request to upload a document for',
		example: 'bd30b99f-a7e5-4c8f-8858-ae723dec5a4d',
		required: true,
		nullable: false,
	})
	documentRequestId: string
}
