import {
	ActionType,
	NotificationType,
} from '@/domain/notification/enterprise/entities/notification'
import { ClientAlreadyExistsError } from '@/domain/financial-management/application/use-cases/errors/client-already-exists-error'
import {
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UseGuards,
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
import { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import { CreateNotificationRequestDTO } from '../../DTOs/notification/create-notification-request-dto'
import { CreateNotificationBadRequestDTO } from '../../DTOs/notification/create-notification-bad-request-dto'
import { OnlyEmployeesCanCreateNotificationDTO } from '../../DTOs/employee/only-employees-can-create-notification-dto'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'

const createNotificationBodySchema = z.object({
	personId: z.string(),
	text: z.string(),
	notificationType: z.nativeEnum(NotificationType),
	actionType: z.nativeEnum(ActionType).optional(),
	linkedDocumentId: z.string().optional(),
	linkedTransactionId: z.string().optional(),
})

type CreateNotificationBodySchema = z.infer<typeof createNotificationBodySchema>

const bodyValidationPipe = new ZodValidationPipe(createNotificationBodySchema)

@ApiTags('Notifications')
@Controller('/notifications')
export class CreateNotificationController {
	constructor(private createNotification: CreateNotificationUseCase) {}

	private errorMap = {
		[ClientAlreadyExistsError.name]: ConflictException,
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Create a new notification',
		description:
			'Creates a new notification for a person referencing their personId.',
	})
	@ApiBody({
		type: CreateNotificationRequestDTO,
	})
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: 'Notification successfully created',
		schema: {
			type: 'object',
			properties: {},
			additionalProperties: false,
		},
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Invalid request body',
		type: CreateNotificationBadRequestDTO,
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Only employees can create notifications',
		type: OnlyEmployeesCanCreateNotificationDTO,
	})
	async handle(@Body(bodyValidationPipe) body: CreateNotificationBodySchema) {
		const {
			personId,
			text,
			notificationType,
			actionType,
			linkedDocumentId,
			linkedTransactionId,
		} = body

		const response = await this.createNotification.execute({
			personId,
			text,
			notificationType,
			actionType,
			linkedDocumentId,
			linkedTransactionId,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || BadRequestException

			throw new exception(error.message)
		}
	}
}
