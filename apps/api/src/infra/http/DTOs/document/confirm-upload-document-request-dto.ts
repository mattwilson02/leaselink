import { ApiProperty } from '@nestjs/swagger'

export class ConfirmUploadDocumentRequestDTO {
	@ApiProperty({
		description: 'Name of the blob to upload',
		example: 'document.pdf',
	})
	blobName: string

	@ApiProperty({
		description: 'ID of the client uploading the document',
		example: 'e3b0c442-98fc-1c14-9af2-d474c5ed654a',
	})
	clientId: string

	@ApiProperty({
		description: 'Content key for the document',
		example: 'e3b0c442-98fc-1c14-9af2-d474c5ed654a',
		nullable: true,
	})
	contentKey?: string | null

	@ApiProperty({
		description: 'Name of the document',
		example: 'My Document',
	})
	name: string

	@ApiProperty({
		description: 'Size of the document file in bytes',
		example: 1024,
	})
	fileSize: number

	@ApiProperty({
		description: 'Thumbnail blob name for the document',
		example: 'thumbnail.jpg',
		nullable: true,
	})
	thumbnailBlobName?: string | null

	@ApiProperty({
		description: 'Folder where the document will be stored',
		example: 'inbox',
	})
	folder: string

	@ApiProperty({
		description: 'ID of the user who uploaded the document',
		example: 'e3b0c442-98fc-1c14-9af2-d474c5ed654a',
	})
	uploadedBy: string
	@ApiProperty({
		description: 'ID of the document request associated with the upload',
		example: 'bd30b99f-a7e5-4c8f-8858-ae723dec5a4d',
	})
	documentRequestId: string
}
