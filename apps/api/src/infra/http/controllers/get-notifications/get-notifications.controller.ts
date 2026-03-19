import {
	Controller,
	Get,
	Query,
	HttpStatus,
	Res,
	NotFoundException,
} from '@nestjs/common'
import { Response } from 'express'
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiQuery,
	ApiBearerAuth,
} from '@nestjs/swagger'
import { GetNotificationsUseCase } from '@/domain/notification/application/use-cases/get-notifications'
import { NotificationType } from '@/domain/notification/enterprise/entities/notification'
import { ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { HttpNotificationsPresenter } from '../../presenters/http-notifications-presenter'
import { GetNotificationsResponseDTO } from '../../DTOs/notification/get-notifications-response.dto'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'

const getNotificationsQuerySchema = z.object({
	offset: z.string().optional(),
	limit: z.string().optional(),
	notificationType: z.nativeEnum(NotificationType).optional(),
	isArchived: z
		.enum(['true', 'false'])
		.optional()
		.transform((val) => val === 'true'),
})

type GetNotificationsQuerySchema = z.infer<typeof getNotificationsQuerySchema>

const queryValidationPipe = new ZodValidationPipe(getNotificationsQuerySchema)

@ApiTags('Notifications')
@Controller('/notifications')
export class GetNotificationsController {
	constructor(
		private readonly getNotificationsUseCase: GetNotificationsUseCase,
	) {}

	private errorMap = {
		[ClientNotFoundError.name]: NotFoundException,
	}

	@Get()
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Retrieve all notifications for current user' })
	@ApiQuery({
		name: 'offset',
		required: false,
		example: 0,
		description: 'Pagination offset',
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		example: 10,
		description: 'Pagination limit',
	})
	@ApiQuery({
		name: 'notificationType',
		required: false,
		enum: NotificationType,
		description: 'Filter notifications by type',
	})
	@ApiQuery({
		name: 'isArchived',
		required: false,
		description: 'Filter notifications by archived status',
		type: Boolean,
		example: false,
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'List of notifications by personId',
		type: GetNotificationsResponseDTO,
	})
	@ApiResponse({
		status: HttpStatus.NO_CONTENT,
		description: 'No notifications found for the given personId',
	})
	async findAll(
		@CurrentUser() user: HttpUserResponse,
		@Query(queryValidationPipe) query: GetNotificationsQuerySchema,
		@Res() res: Response,
	) {
		const offset = Number(query.offset) || 0
		const limit = Number(query.limit) || 10

		const { notificationType, isArchived } = query

		const personId = user.id

		if (!user || !personId) {
			throw this.errorMap[ClientNotFoundError.name]
		}

		const result = await this.getNotificationsUseCase.execute({
			personId,
			offset,
			limit,
			notificationType,
			isArchived,
		})

		if (
			!result.value ||
			!result.value.notifications ||
			result.value.notifications.length === 0
		) {
			return res.status(HttpStatus.NO_CONTENT).send()
		}

		const notifications = result.value.notifications

		return res.status(HttpStatus.OK).json({
			notifications: HttpNotificationsPresenter.toHTTP(notifications),
		})
	}
}
