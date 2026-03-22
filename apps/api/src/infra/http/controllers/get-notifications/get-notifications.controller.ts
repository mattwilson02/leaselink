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
	page: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce.number().int().positive().max(200).default(10),
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
		name: 'page',
		required: false,
		example: 1,
		description: 'Page number',
	})
	@ApiQuery({
		name: 'pageSize',
		required: false,
		example: 10,
		description: 'Number of items per page',
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
		description: 'Paginated list of notifications for current user',
		type: GetNotificationsResponseDTO,
	})
	async findAll(
		@CurrentUser() user: HttpUserResponse,
		@Query(queryValidationPipe) query: GetNotificationsQuerySchema,
		@Res() res: Response,
	) {
		const offset = (query.page - 1) * query.pageSize
		const limit = query.pageSize

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

		const notifications = result.value?.notifications ?? []
		const totalCount = result.value?.totalCount ?? 0

		return res.status(HttpStatus.OK).json({
			data: HttpNotificationsPresenter.toHTTP(notifications),
			meta: {
				page: query.page,
				pageSize: query.pageSize,
				totalCount,
				totalPages: Math.ceil(totalCount / query.pageSize),
			},
		})
	}
}
