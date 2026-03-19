import { CreateLeaseUseCase } from '@/domain/lease-management/application/use-cases/create-lease'
import { LeasePropertyNotAvailableError } from '@/domain/lease-management/application/use-cases/errors/lease-property-not-available-error'
import { LeasePropertyHasActiveLeaseError } from '@/domain/lease-management/application/use-cases/errors/lease-property-has-active-lease-error'
import { LeaseTenantHasActiveLeaseError } from '@/domain/lease-management/application/use-cases/errors/lease-tenant-has-active-lease-error'
import { PropertyNotFoundError } from '@/domain/property-management/application/use-cases/errors/property-not-found-error'
import {
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
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
import { createLeaseSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { HttpLeasePresenter } from '../../presenters/http-lease-presenter'
import { z } from 'zod'

type CreateLeaseBody = z.infer<typeof createLeaseSchema>

const bodyValidationPipe = new ZodValidationPipe(createLeaseSchema)

@ApiTags('Leases')
@Controller('/leases')
export class CreateLeaseController {
	constructor(private createLease: CreateLeaseUseCase) {}

	private errorMap: Record<string, any> = {
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
	async handle(@Body(bodyValidationPipe) body: CreateLeaseBody) {
		const response = await this.createLease.execute({
			propertyId: body.propertyId,
			tenantId: body.tenantId,
			startDate: body.startDate,
			endDate: body.endDate,
			monthlyRent: body.monthlyRent,
			securityDeposit: body.securityDeposit,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || BadRequestException
			throw new exception(error.message)
		}

		return {
			data: HttpLeasePresenter.toHTTP(response.value.lease),
		}
	}
}
