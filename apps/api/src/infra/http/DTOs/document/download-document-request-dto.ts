import { ApiProperty } from '@nestjs/swagger'

export class DownloadDocumentRequestDTO {
	@ApiProperty({
		description: 'The document ID of the file to download',
		example: '9876-1234-5678-90ab-cdef12345678',
	})
	documentId: string
}
