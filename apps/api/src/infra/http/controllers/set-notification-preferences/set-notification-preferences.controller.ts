import { SetNotificationPreferencesUseCase } from '@/domain/financial-management/application/use-cases/set-notification-preferences'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Patch,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { NotificationPreferencesResponseDTO } from '../../DTOs/client/notification-preferences-response-dto'
import { SetNotificationPreferencesRequestDTO } from '../../DTOs/client/set-notification-preferences-request-dto'
import { HttpUserResponse } from '../../presenters/http-user-presenter'

const setNotificationPreferencesBodySchema = z.object({
	receivesEmailNotifications: z.boolean().optional(),
	receivesPushNotifications: z.boolean().optional(),
	receivesNotificationsForPortfolio: z.boolean().optional(),
	receivesNotificationsForDocuments: z.boolean().optional(),
})

type SetNotificationPreferencesBodySchema = z.infer<
	typeof setNotificationPreferencesBodySchema
>

const bodyValidationPipe = new ZodValidationPipe(
	setNotificationPreferencesBodySchema,
)

@ApiTags('Clients')
@Controller('/clients/notification-preferences')
export class SetNotificationPreferencesController {
	constructor(
		private setNotificationPreferences: SetNotificationPreferencesUseCase,
	) {}

	private errorMap = {
		[ClientNotFoundError.name]: NotFoundException,
	}

	@Patch()
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Set notification preferences',
		description:
			'Updates notification preferences for the authenticated client.',
	})
	@ApiBody({
		type: SetNotificationPreferencesRequestDTO,
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Notification preferences successfully updated',
		type: NotificationPreferencesResponseDTO,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Invalid request body',
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Client not found',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Body(bodyValidationPipe) body: SetNotificationPreferencesBodySchema,
	) {
		const {
			receivesEmailNotifications,
			receivesPushNotifications,
			receivesNotificationsForPortfolio,
			receivesNotificationsForDocuments,
		} = body

		const response = await this.setNotificationPreferences.execute({
			clientId: user.id,
			receivesEmailNotifications,
			receivesPushNotifications,
			receivesNotificationsForPortfolio,
			receivesNotificationsForDocuments,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || BadRequestException

			throw new exception(error.message)
		}

		const { client } = response.value

		return {
			receivesEmailNotifications: client.receivesEmailNotifications,
			receivesPushNotifications: client.receivesPushNotifications,
			receivesNotificationsForPortfolio:
				client.receivesNotificationsForPortfolio,
			receivesNotificationsForDocuments:
				client.receivesNotificationsForDocuments,
		}
	}
}
