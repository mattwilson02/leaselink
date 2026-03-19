import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	UnauthorizedException,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { GetHasUnreadNotificationsUseCase } from '@/domain/notification/application/use-cases/get-has-unread-notifications'

@ApiTags('Notifications')
@Controller('/has-notifications-unread')
export class GetHasUnreadNotificationsController {
	constructor(
		private getHasUnreadNotifications: GetHasUnreadNotificationsUseCase,
	) {}

	@Get()
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Check if the user has unread notifications',
		description: 'Checks if the user has any unread notifications.',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Successfully checked for unread notifications',
		schema: {
			type: 'object',
			properties: {
				hasUnreadNotifications: { type: 'boolean', example: true },
			},
			additionalProperties: false,
		},
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'User not authenticated',
	})
	async handle(@CurrentUser() user: HttpUserResponse) {
		if (!user?.id) {
			throw new UnauthorizedException('Valid user ID is required')
		}

		const response = await this.getHasUnreadNotifications.execute({
			personId: user.id,
		})

		return {
			hasUnreadNotifications: response.value?.hasUnreadNotifications,
		}
	}
}
