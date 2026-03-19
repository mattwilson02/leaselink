import {
	Controller,
	Patch,
	Body,
	NotFoundException,
	Param,
	HttpStatus,
	UnprocessableEntityException,
} from '@nestjs/common'
import {
	ApiTags,
	ApiResponse,
	ApiOperation,
	ApiBody,
	ApiBearerAuth,
	ApiParam,
	ApiOkResponse,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { UpdateNotificationUseCase } from '@/domain/notification/application/use-cases/update-notification'
import { HttpNotificationSinglePresenter } from '../../presenters/http-notification-single-presenter'
import { NotificationNotFoundError } from '@/domain/notification/application/use-cases/errors/notification-not-found-error'
import { UpdateNotificationRequestDTO } from '../../DTOs/notification/update-notification-request-dto'
import { UpdateNotificationResponseDTO } from '../../DTOs/notification/update-notification-response-dto'
import { UpdateNotificationUnprocessableEntityDTO } from '../../DTOs/notification/update-notification-unprocessable-entity-dto'
import { UpdateNotificationNotFoundDTO } from '../../DTOs/notification/update-notification-not-found-dto'
import { NotificationActionIncompleteError } from '@/domain/notification/application/use-cases/errors/notification-action-incomplete-error'
import { NotificationActionCantBeCompletedError } from '@/domain/notification/application/use-cases/errors/notification-action-cant-be-completed-error'

const updateNotificationBodySchema = z.object({
	isRead: z.boolean().optional(),
	isActionComplete: z.boolean().optional(),
	isArchived: z.boolean().optional(),
})

type UpdateNotificationBodySchema = z.infer<typeof updateNotificationBodySchema>

const bodyValidationPipe = new ZodValidationPipe(updateNotificationBodySchema)

@ApiTags('Notifications')
@Controller('/notifications/:id')
export class UpdateNotificationController {
	constructor(
		private readonly updateNotificationUseCase: UpdateNotificationUseCase,
	) {}
	private errorMap = {
		[NotificationNotFoundError.name]: NotFoundException,
		[NotificationActionIncompleteError.name]: UnprocessableEntityException,
		[NotificationActionCantBeCompletedError.name]: UnprocessableEntityException,
	}

	@Patch()
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Update a notification' })
	@ApiParam({
		name: 'id',
		required: true,
		description: 'The ID of the notification to update',
		example: '63790fd1-7e80-4765-9027-114b07e07e7b',
	})
	@ApiBody({ type: UpdateNotificationRequestDTO })
	@ApiOkResponse({
		description: 'Notification updated',
		type: UpdateNotificationResponseDTO,
	})
	@ApiResponse({
		status: HttpStatus.UNPROCESSABLE_ENTITY,
		description: 'Notification action is incomplete or cannot be completed',
		type: UpdateNotificationUnprocessableEntityDTO,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Notification not found',
		type: UpdateNotificationNotFoundDTO,
	})
	async update(
		@Param('id') id: string,
		@Body(bodyValidationPipe) body: UpdateNotificationBodySchema,
	): Promise<UpdateNotificationResponseDTO> {
		const { isRead, isActionComplete, isArchived } = body

		const result = await this.updateNotificationUseCase.execute({
			notificationId: id,
			isRead,
			isActionComplete,
			isArchived,
		})

		if (result.isLeft()) {
			const error = result.value
			const exception =
				this.errorMap[error.constructor.name] || NotFoundException

			throw new exception(error.message)
		}

		const { notification } = result.value

		return HttpNotificationSinglePresenter.toHTTP(notification)
	}
}
