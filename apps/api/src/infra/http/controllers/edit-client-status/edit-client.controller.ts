import { EditClientUseCase } from '@/domain/financial-management/application/use-cases/edit-client'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { InvalidClientOnboardingStatusError } from '@/domain/financial-management/application/use-cases/errors/invalid-client-onbooarding-status-error'
import { InvalidClientStatusError } from '@/domain/financial-management/application/use-cases/errors/invalid-client-status-error'
import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Put,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { ClientDTO } from '../../DTOs/client/client-dto'
import { HttpClientPresenter } from '../../presenters/http-client-presenter'

const editClientBodySchema = z.object({
	status: z.enum(['ACTIVE', 'INACTIVE', 'INVITED']).optional(),
	deviceId: z.string().optional(),
	pushToken: z.string().optional(),
	onboardingStatus: z
		.enum([
			'NEW',
			'EMAIL_VERIFIED',
			'PHONE_VERIFIED',
			'PASSWORD_SET',
			'ONBOARDED',
		])
		.optional(),
})

type EditClientBodySchema = z.infer<typeof editClientBodySchema>

const bodyValidationPipe = new ZodValidationPipe(editClientBodySchema)

@ApiTags('Clients')
@Controller('/clients/:id')
export class EditClientController {
	constructor(private editClient: EditClientUseCase) {}

	private errorMap = {
		[ClientNotFoundError.name]: NotFoundException,
		[InvalidClientStatusError.name]: BadRequestException,
		[InvalidClientOnboardingStatusError.name]: BadRequestException,
	}

	@Put()
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Update client',
		description:
			'Updates the status or onboarding status of an existing client.',
	})
	@ApiParam({ name: 'id', description: 'Client ID', type: String })
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				status: {
					type: 'string',
					description: 'The new status for the client',
					enum: ['ACTIVE', 'INACTIVE', 'INVITED'],
				},
				deviceId: {
					type: 'string',
					example: '1234567890',
					description: 'The device ID for the client',
				},
				pushToken: {
					type: 'string',
					example: '1234567890',
					description: 'The device ID for the client',
				},
				onboardingStatus: {
					type: 'string',
					description: 'The new onboarding status for the client',
					enum: [
						'NEW',
						'EMAIL_VERIFIED',
						'PHONE_VERIFIED',
						'PASSWORD_SET',
						'ONBOARDED',
					],
				},
			},
		},
		description: 'Client update payload',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Client successfully updated',
		type: ClientDTO,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Invalid client status or onboarding status',
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Client not found',
	})
	async handle(
		@Param('id') id: string,
		@Body(bodyValidationPipe) body: EditClientBodySchema,
	) {
		const { status, onboardingStatus, deviceId, pushToken } = body

		const response = await this.editClient.execute({
			id,
			status,
			onboardingStatus,
			deviceId,
			pushToken,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || BadRequestException

			throw new exception(error.message)
		}

		return HttpClientPresenter.toHTTP(response.value.client)
	}
}
