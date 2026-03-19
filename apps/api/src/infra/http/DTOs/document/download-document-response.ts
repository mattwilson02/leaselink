import { ApiProperty } from '@nestjs/swagger'

export class DownloadDocumentResponseDTO {
	@ApiProperty({
		description: 'The URL to download the document',
		example: 'https://storage.example.com/documents/12345?token=abcde',
	})
	downloadUrl: string

	@ApiProperty({
		description: 'The unique identifier for the document blob in storage',
		example: 'documents/2023/invoice-12345.pdf',
	})
	blobName: string

	@ApiProperty({
		description:
			'The expiration date/time of the download URL in ISO 8601 format',
		example: '2023-12-31T23:59:59Z',
	})
	expiresOn: string
}
