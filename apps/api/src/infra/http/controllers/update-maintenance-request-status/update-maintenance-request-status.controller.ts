import { UpdateMaintenanceRequestStatusUseCase } from '@/domain/maintenance/application/use-cases/update-maintenance-request-status'
import { MaintenanceRequestNotFoundError } from '@/domain/maintenance/application/use-cases/errors/maintenance-request-not-found-error'
import { MaintenanceOnlyManagerCanUpdateStatusError } from '@/domain/maintenance/application/use-cases/errors/maintenance-only-manager-can-update-status-error'
import {
	BadRequestException,
	Body,
	Controller,
	ForbiddenException,
	NotFoundException,
	Param,
	Patch,
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

const updateStatusSchema = z.object({
	status: z.string().min(1),
})

type UpdateStatusBody = z.infer<typeof updateStatusSchema>

const bodyValidationPipe = new ZodValidationPipe(updateStatusSchema)

@ApiTags('Maintenance Requests')
@Controller('/maintenance-requests')
export class UpdateMaintenanceRequestStatusController {
	constructor(
		private updateMaintenanceRequestStatus: UpdateMaintenanceRequestStatusUseCase,
	) {}

	@Patch(':id/status')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Update maintenance request status' })
	@ApiParam({ name: 'id', description: 'Maintenance request UUID' })
	@ApiBody({
		schema: {
			type: 'object',
			required: ['status'],
			properties: {
				status: {
					type: 'string',
					enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
				},
			},
		},
	})
	@ApiResponse({ status: 200, description: 'Status updated' })
	@ApiResponse({ status: 400, description: 'Invalid transition' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@ApiResponse({ status: 404, description: 'Not found' })
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') requestId: string,
		@Body(bodyValidationPipe) body: UpdateStatusBody,
	) {
		const userRole = user.type === 'EMPLOYEE' ? 'manager' : 'tenant'

		const response = await this.updateMaintenanceRequestStatus.execute({
			requestId,
			userId: user.id,
			userRole,
			status: body.status,
		})

		if (response.isLeft()) {
			const error = response.value
			if (error instanceof MaintenanceRequestNotFoundError) {
				throw new NotFoundException(error.message)
			}
			if (error instanceof MaintenanceOnlyManagerCanUpdateStatusError) {
				throw new ForbiddenException(error.message)
			}
			throw new BadRequestException(error.message)
		}

		return {
			maintenanceRequest: HttpMaintenanceRequestPresenter.toHTTP(
				response.value.request,
			),
		}
	}
}
