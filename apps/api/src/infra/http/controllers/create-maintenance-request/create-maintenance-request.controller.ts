import { CreateMaintenanceRequestUseCase } from '@/domain/maintenance/application/use-cases/create-maintenance-request'
import { MaintenanceNoActiveLeaseError } from '@/domain/maintenance/application/use-cases/errors/maintenance-no-active-lease-error'
import { CreateAuditLogUseCase } from '@/domain/audit/application/use-cases/create-audit-log'
import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Optional,
	Post,
	UnauthorizedException,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { createMaintenanceRequestSchema } from '@leaselink/shared'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpMaintenanceRequestPresenter } from '../../presenters/http-maintenance-request-presenter'
import { z } from 'zod'

type CreateMaintenanceRequestBody = z.infer<
	typeof createMaintenanceRequestSchema
>

const bodyValidationPipe = new ZodValidationPipe(createMaintenanceRequestSchema)

@ApiTags('Maintenance Requests')
@Controller('/maintenance-requests')
export class CreateMaintenanceRequestController {
	constructor(
		private createMaintenanceRequest: CreateMaintenanceRequestUseCase,
		@Optional() private createAuditLog?: CreateAuditLogUseCase,
	) {}

	private errorMap = {
		[MaintenanceNoActiveLeaseError.name]: BadRequestException,
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Create a new maintenance request (tenant only)' })
	@ApiBody({
		schema: {
			type: 'object',
			required: ['propertyId', 'title', 'description', 'category'],
			properties: {
				propertyId: { type: 'string', format: 'uuid' },
				title: { type: 'string', maxLength: 200 },
				description: { type: 'string', maxLength: 5000 },
				category: {
					type: 'string',
					enum: [
						'PLUMBING',
						'ELECTRICAL',
						'HVAC',
						'APPLIANCE',
						'STRUCTURAL',
						'PEST_CONTROL',
						'OTHER',
					],
				},
				priority: {
					type: 'string',
					enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'],
				},
			},
		},
	})
	@ApiResponse({ status: HttpStatus.CREATED, description: 'Request created' })
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'No active lease or invalid input',
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Not authenticated',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Body(bodyValidationPipe) body: CreateMaintenanceRequestBody,
	) {
		if (user.type !== 'CLIENT') {
			throw new UnauthorizedException(
				'Only tenants can create maintenance requests',
			)
		}

		const response = await this.createMaintenanceRequest.execute({
			tenantId: user.id,
			...body,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || BadRequestException
			throw new exception(error.message)
		}

		const result = {
			maintenanceRequest: HttpMaintenanceRequestPresenter.toHTTP(
				response.value.request,
			),
		}

		this.createAuditLog
			?.execute({
				actorId: user.id,
				actorType: 'CLIENT',
				action: 'CREATE',
				resourceType: 'MAINTENANCE_REQUEST',
				resourceId: response.value.request.id.toString(),
				metadata: { title: body.title, priority: body.priority },
			})
			.catch((err) => console.error('Audit log failed:', err))

		return result
	}
}
