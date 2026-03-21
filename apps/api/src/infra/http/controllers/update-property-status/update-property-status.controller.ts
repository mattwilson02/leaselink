import { UpdatePropertyStatusUseCase } from '@/domain/property-management/application/use-cases/update-property-status'
import { PropertyNotFoundError } from '@/domain/property-management/application/use-cases/errors/property-not-found-error'
import { InvalidPropertyStatusTransitionError } from '@/domain/property-management/application/use-cases/errors/invalid-property-status-transition-error'
import { PropertyHasActiveLeaseError } from '@/domain/property-management/application/use-cases/errors/property-has-active-lease-error'
import { CreateAuditLogUseCase } from '@/domain/audit/application/use-cases/create-audit-log'
import {
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	HttpStatus,
	NotFoundException,
	Optional,
	Param,
	Patch,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { PropertyStatus } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpPropertyPresenter } from '../../presenters/http-property-presenter'

const updateStatusSchema = z.object({
	status: z.nativeEnum(PropertyStatus),
})

type UpdateStatusBody = z.infer<typeof updateStatusSchema>

const bodyValidationPipe = new ZodValidationPipe(updateStatusSchema)

@ApiTags('Properties')
@Controller('/properties')
export class UpdatePropertyStatusController {
	constructor(
		private updatePropertyStatus: UpdatePropertyStatusUseCase,
		@Optional() private createAuditLog?: CreateAuditLogUseCase,
	) {}

	private errorMap = {
		[PropertyNotFoundError.name]: NotFoundException,
		[InvalidPropertyStatusTransitionError.name]: BadRequestException,
		[PropertyHasActiveLeaseError.name]: ConflictException,
	}

	@Patch(':id/status')
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Update property status' })
	@ApiParam({ name: 'id', description: 'Property UUID' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Status updated',
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Invalid status transition',
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Property not found',
	})
	@ApiResponse({
		status: HttpStatus.CONFLICT,
		description: 'Property has active lease',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') propertyId: string,
		@Body(bodyValidationPipe) body: UpdateStatusBody,
	) {
		const response = await this.updatePropertyStatus.execute({
			propertyId,
			managerId: user.id,
			status: body.status,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || BadRequestException
			throw new exception(error.message)
		}

		const result = {
			property: HttpPropertyPresenter.toHTTP(response.value.property),
		}

		this.createAuditLog
			?.execute({
				actorId: user.id,
				actorType: 'EMPLOYEE',
				action: 'STATUS_CHANGE',
				resourceType: 'PROPERTY',
				resourceId: propertyId,
				metadata: { to: body.status },
			})
			.catch((err) => console.error('Audit log failed:', err))

		return result
	}
}
