import { CreateLeaseUseCase } from '@/domain/lease-management/application/use-cases/create-lease'
import { LeasePropertyNotAvailableError } from '@/domain/lease-management/application/use-cases/errors/lease-property-not-available-error'
import { LeasePropertyHasActiveLeaseError } from '@/domain/lease-management/application/use-cases/errors/lease-property-has-active-lease-error'
import { LeaseTenantHasActiveLeaseError } from '@/domain/lease-management/application/use-cases/errors/lease-tenant-has-active-lease-error'
import { PropertyNotFoundError } from '@/domain/property-management/application/use-cases/errors/property-not-found-error'
import { CreateAuditLogUseCase } from '@/domain/audit/application/use-cases/create-audit-log'
import {
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Optional,
	Post,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { createLeaseSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpLeasePresenter } from '../../presenters/http-lease-presenter'
import { z } from 'zod'

type CreateLeaseBody = z.infer<typeof createLeaseSchema>

const bodyValidationPipe = new ZodValidationPipe(createLeaseSchema)

@ApiTags('Leases')
@Controller('/leases')
export class CreateLeaseController {
	constructor(
		private createLease: CreateLeaseUseCase,
		@Optional() private createAuditLog?: CreateAuditLogUseCase,
	) {}

	private errorMap = {
		[PropertyNotFoundError.name]: NotFoundException,
		[LeasePropertyNotAvailableError.name]: BadRequestException,
		[LeasePropertyHasActiveLeaseError.name]: ConflictException,
		[LeaseTenantHasActiveLeaseError.name]: ConflictException,
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Create a new lease' })
	@ApiResponse({ status: HttpStatus.CREATED, description: 'Lease created' })
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Body(bodyValidationPipe) body: CreateLeaseBody,
	) {
		const response = await this.createLease.execute({
			propertyId: body.propertyId,
			tenantId: body.tenantId,
			startDate: body.startDate,
			endDate: body.endDate,
			monthlyRent: body.monthlyRent,
			securityDeposit: body.securityDeposit,
			earlyTerminationFee: body.earlyTerminationFee ?? null,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || BadRequestException
			throw new exception(error.message)
		}

		const result = { data: HttpLeasePresenter.toHTTP(response.value.lease) }

		this.createAuditLog
			?.execute({
				actorId: user.id,
				actorType: 'EMPLOYEE',
				action: 'CREATE',
				resourceType: 'LEASE',
				resourceId: response.value.lease.id.toString(),
				metadata: { propertyId: body.propertyId, tenantId: body.tenantId },
			})
			.catch((err) => console.error('Audit log failed:', err))

		return result
	}
}
