import { ApiProperty } from '@nestjs/swagger'
import { GetNotificationsDTO } from './get-notifications-dto'

export class GetNotificationsResponseDTO {
	@ApiProperty({
		type: [GetNotificationsDTO],
		description: 'Array of notifications',
	})
	notifications: GetNotificationsDTO[]
}
