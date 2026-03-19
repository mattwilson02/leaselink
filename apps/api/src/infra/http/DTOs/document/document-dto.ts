import { ApiProperty } from '@nestjs/swagger'

export class DocumentDTO {
	@ApiProperty({
		example: 'e3b0c442-98fc-1c14-9af2-d474c5ed654a',
		description: 'Unique identifier of the document',
		nullable: false,
	})
	id: string

	@ApiProperty({
		example: 'John Doe',
		description: 'Name of the document',
	})
	name: string

	@ApiProperty({
		example: 'e3b0c442-98fc-1c14-9af2-d474c5ed654a',
		description: 'Unique identifier of the document in the storage system',
	})
	contentKey: string

	@ApiProperty({
		example: 'https://example.com/download/document.pdf',
		description: 'Link to download the document',
	})
	blobName: string

	@ApiProperty({
		example: 10,
		description: 'Size of the document file in bytes',
	})
	fileSize: number

	@ApiProperty({
		example: 'https://example.com/thumbnail/document-thumbnail.jpg',
		description: 'Link to the thumbnail of the document',
		nullable: true,
	})
	thumbnailBlobName: string | null

	@ApiProperty({
		example: 'IDENTIFICATION',
		description: 'Folder where the document is stored',
	})
	folder: string

	@ApiProperty({
		example: 'e3b0c442-98fc-1c14-9af2-d474c5ed654a',
		description: 'Unique identifier of the user who uploaded the document',
	})
	uploadedBy: string

	@ApiProperty({
		example: 'e3b0c442-98fc-1c14-9af2-d474c5ed654a',
		description: 'Unique identifier of the client associated with the document',
	})
	clientId: string

	@ApiProperty({
		example: 1,
		description: 'Version number of the document',
	})
	version: number

	@ApiProperty({
		example: '2023-10-01T12:00:00Z',
		description: 'Creation date of the document',
		type: String,
		format: 'date-time',
	})
	createdAt: string

	@ApiProperty({
		example: '2023-10-01T12:00:00Z',
		description: 'Last update date of the document',
		type: String,
		format: 'date-time',
		nullable: true,
	})
	updatedAt: string | null

	@ApiProperty({
		example: '2023-10-05T15:30:00Z',
		description: 'Last viewed date of the document',
		type: String,
		format: 'date-time',
		nullable: true,
	})
	viewedAt: string | null
}
