import { ConfirmMaintenancePhotosUseCase } from '@/domain/maintenance/application/use-cases/confirm-maintenance-photos'
import { MaintenanceRequestNotFoundError } from '@/domain/maintenance/application/use-cases/errors/maintenance-request-not-found-error'
import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
	UnauthorizedException,
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
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpMaintenanceRequestPresenter } from '../../presenters/http-maintenance-request-presenter'

const confirmPhotosSchema = z.object({
	blobKeys: z
		.array(z.string().min(1))
		.min(1, 'At least one blob key is required'),
})

type ConfirmPhotosBody = z.infer<typeof confirmPhotosSchema>

const bodyValidationPipe = new ZodValidationPipe(confirmPhotosSchema)

@ApiTags('Maintenance Requests')
@Controller('/maintenance-requests')
export class ConfirmMaintenancePhotosController {
	constructor(
		private confirmMaintenancePhotos: ConfirmMaintenancePhotosUseCase,
	) {}

	@Post(':id/photos/confirm')
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Confirm photo uploads for maintenance request (tenant only)',
	})
	@ApiParam({ name: 'id', description: 'Maintenance request UUID' })
	@ApiBody({
		schema: {
			type: 'object',
			required: ['blobKeys'],
			properties: {
				blobKeys: {
					type: 'array',
					items: { type: 'string' },
					description: 'Array of blob keys from upload URLs',
				},
			},
		},
	})
	@ApiResponse({ status: 200, description: 'Photos confirmed' })
	@ApiResponse({ status: 404, description: 'Not found' })
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') requestId: string,
		@Body(bodyValidationPipe) body: ConfirmPhotosBody,
	) {
		if (user.type !== 'CLIENT') {
			throw new UnauthorizedException('Only tenants can confirm photos')
		}

		const response = await this.confirmMaintenancePhotos.execute({
			requestId,
			tenantId: user.id,
			blobKeys: body.blobKeys,
		})

		if (response.isLeft()) {
			const error = response.value
			if (error instanceof MaintenanceRequestNotFoundError) {
				throw new NotFoundException(error.message)
			}
			throw new BadRequestException((error as Error).message)
		}

		return {
			maintenanceRequest: HttpMaintenanceRequestPresenter.toHTTP(
				response.value.request,
			),
		}
	}
}
