import { ApiProperty } from '@nestjs/swagger'

export class FolderItemDTO {
	@ApiProperty({
		example: 'IDENTIFICATION',
		description: 'Folder name',
		enum: [
			'IDENTIFICATION',
			'LEASE_AGREEMENTS',
			'SIGNED_DOCUMENTS',
			'INSPECTION_REPORTS',
			'INSURANCE',
			'OTHER',
		],
	})
	folderName: string

	@ApiProperty({
		example: 5,
		description: 'Number of files in the folder',
	})
	fileCount: number

	@ApiProperty({
		example: 5,
		description: 'Total file size in the folder',
	})
	totalFileSizeSum: number

	@ApiProperty({
		example: '2023-10-05T14:48:00.000Z',
		description: 'Most recent updated date in the folder',
		type: String,
		format: 'date-time',
		nullable: true,
	})
	mostRecentUpdatedDate: Date | null
}
