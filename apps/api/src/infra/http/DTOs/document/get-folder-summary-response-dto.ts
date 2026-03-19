import { ApiProperty } from '@nestjs/swagger'
import { FolderItemDTO } from './get-folder-summary-item-dto'

export class GetFolderSummaryResponseDTO {
	@ApiProperty({
		description: 'Documents grouped by folder',
		type: [FolderItemDTO],
		example: [
			{
				folderName: 'IDENTIFICATION',
				fileCount: 5,
				totalFileSizeSum: 2048,
				mostRecentUpdatedDate: '2023-10-01T12:34:56Z',
			},
		],
	})
	documentsByFolder: FolderItemDTO[]
}
