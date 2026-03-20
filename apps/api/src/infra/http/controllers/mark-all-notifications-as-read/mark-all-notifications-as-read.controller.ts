import {
	Controller,
	Patch,
	HttpStatus,
	UnauthorizedException,
} from '@nestjs/common'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
} from '@nestjs/swagger'
import { MarkAllNotificationsAsReadUseCase } from '@/domain/notification/application/use-cases/mark-all-notifications-as-read'
import { MarkAllNotificationsAsReadResponseDTO } from '../../DTOs/notification/mark-all-notifications-as-read-response-dto'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'

@ApiTags('Notifications')
@Controller('/mark-all-notifications-as-read')
export class MarkAllNotificationsAsReadController {
	constructor(
		private readonly markAllNotificationsAsReadUseCase: MarkAllNotificationsAsReadUseCase,
	) {}

	@Patch()
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Mark all notifications as read for current user' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'All notifications marked as read',
		type: MarkAllNotificationsAsReadResponseDTO,
	})
	async markAllAsRead(
		@CurrentUser() user: HttpUserResponse,
	): Promise<MarkAllNotificationsAsReadResponseDTO> {
		const personId = user.id

		if (!personId) {
			throw new UnauthorizedException()
		}

		const result = await this.markAllNotificationsAsReadUseCase.execute({
			personId,
		})

		if (result.isRight()) {
			return { count: result.value.count }
		}

		return { count: 0 }
	}
}
