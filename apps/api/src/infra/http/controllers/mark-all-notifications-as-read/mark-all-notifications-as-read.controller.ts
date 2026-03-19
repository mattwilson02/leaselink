import {
	Controller,
	Patch,
	NotFoundException,
	HttpStatus,
} from '@nestjs/common'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
} from '@nestjs/swagger'
import { MarkAllNotificationsAsReadUseCase } from '@/domain/notification/application/use-cases/mark-all-notifications-as-read'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { MarkAllNotificationsAsReadResponseDTO } from '../../DTOs/notification/mark-all-notifications-as-read-response-dto'
import { MarkAllNotificationsAsReadNotFoundDTO } from '../../DTOs/notification/mark-all-notifications-as-read-not-found-dto'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'

@ApiTags('Notifications')
@Controller('/mark-all-notifications-as-read')
export class MarkAllNotificationsAsReadController {
	constructor(
		private readonly markAllNotificationsAsReadUseCase: MarkAllNotificationsAsReadUseCase,
	) {}

	private errorMap = {
		[ClientNotFoundError.name]: NotFoundException,
	}

	@Patch()
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Mark all notifications as read for current user' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'All notifications marked as read',
		type: MarkAllNotificationsAsReadResponseDTO,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Person or notifications not found',
		type: MarkAllNotificationsAsReadNotFoundDTO,
	})
	async markAllAsRead(
		@CurrentUser() user: HttpUserResponse,
	): Promise<MarkAllNotificationsAsReadResponseDTO> {
		const personId = user.id

		if (!user || !personId) {
			throw this.errorMap[ClientNotFoundError.name]
		}

		const result = await this.markAllNotificationsAsReadUseCase.execute({
			personId,
		})

		if (result.isLeft()) {
			const error = result.value
			const exception =
				this.errorMap[error.constructor.name] || NotFoundException

			throw new exception(error.message)
		}
		return { count: result.value.count }
	}
}
