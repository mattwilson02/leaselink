import { ApiProperty } from '@nestjs/swagger'
import { DocumentRequestTypeType } from '@/domain/document/enterprise/entities/value-objects/document-request-type'
import { DocumentRequestStatusType } from '@/domain/document/enterprise/entities/value-objects/document-request-status'

export class DocumentRequestDTO {
	@ApiProperty({
		example: 'e2b0c442-98fc-1c14-9af2-d474c5ed654a',
		description: 'Unique identifier of the document request',
	})
	id: string

	@ApiProperty({
		example: 'e3b0c442-98fc-1c14-9af2-d474c5ed654a',
		description: 'Unique identifier of the client',
	})
	clientId: string

	@ApiProperty({
		example: 'e4b2c442-98fc-2c14-5af2-d474c5ed654a',
		description: 'Unique identifier of the user who requested the document',
	})
	requestedBy: string

	@ApiProperty({
		example: 'PENDING',
		description: 'Status of the document request',
		enum: ['PENDING', 'UPLOADED', 'CANCELED'],
	})
	status: DocumentRequestStatusType

	@ApiProperty({
		example: 'PROOF_OF_IDENTITY',
		description: 'Type of the document request',
		enum: ['PROOF_OF_ADDRESS', 'PROOF_OF_IDENTITY'],
	})
	requestType: DocumentRequestTypeType

	@ApiProperty({
		example: '2024-07-03T12:34:56.789Z',
		description: 'Date and time when the document request was created',
		type: String,
		format: 'date-time',
	})
	createdAt: string

	@ApiProperty({
		example: '2024-07-03T12:34:56.789Z',
		description: 'Date and time when the document request was last updated',
		type: String,
		format: 'date-time',
		required: false,
		nullable: true,
	})
	updatedAt?: string | null

	@ApiProperty({
		example: 'e6b1c442-98fc-1c14-9af2-d474c5ed654a',
		description: 'Unique identifier of the related document, if available',
		required: false,
		nullable: true,
	})
	documentId?: string | null
}
