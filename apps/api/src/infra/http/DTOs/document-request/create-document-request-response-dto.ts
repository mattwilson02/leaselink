import { ApiProperty } from '@nestjs/swagger'

export class DocumentRequestResponseDTO {
	@ApiProperty({
		example: 'a37bf2c9-9f1f-4eea-924b-4d6617cd5aff',
		description: 'Unique identifier of the document request',
	})
	id: string

	@ApiProperty({
		example: 'a37bf2c9-9f1f-4eea-924b-4d6617cd5aff',
		description: 'Client ID',
	})
	clientId: string

	@ApiProperty({
		example: 'a37bf2c9-9f1f-4eea-924b-4d6617cd5aff',
		description: 'User ID who requested the document',
	})
	requestedBy: string

	@ApiProperty({
		example: 'PROOF_OF_ADDRESS',
		description: 'Type of document request',
	})
	requestType: string

	@ApiProperty({
		example: 'PENDING',
		description: 'Status of the document request',
	})
	status: string

	@ApiProperty({
		example: 'e3b0c442-98fc-1c14-9af2-d474c5ed654a',
		description: 'Linked document ID',
		nullable: true,
	})
	documentId: string | null

	@ApiProperty({
		example: '2023-10-01T12:00:00Z',
		description: 'Creation date',
		type: String,
		format: 'date-time',
	})
	createdAt: string

	@ApiProperty({
		example: '2023-10-01T12:00:00Z',
		description: 'Last update date',
		type: String,
		format: 'date-time',
		nullable: true,
	})
	updatedAt: string | null
}
