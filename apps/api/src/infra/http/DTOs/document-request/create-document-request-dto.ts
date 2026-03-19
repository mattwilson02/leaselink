import { ApiProperty } from '@nestjs/swagger'

export class CreateDocumentRequestDTO {
	@ApiProperty({
		example: 'a37bf2c9-9f1f-4eea-924b-4d6617cd5aff',
		description: 'Unique identifier of the client whose document is requested',
	})
	clientId: string

	@ApiProperty({
		example: 'a37bf2c9-9f1f-4eea-924b-4d6617cd5aff',
		description: 'Unique identifier of the user who is requesting',
	})
	requestedBy: string

	@ApiProperty({
		example: 'PROOF_OF_ADDRESS',
		description: 'Type of document request',
	})
	requestType: string
}
