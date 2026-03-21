import { RenewLeaseUseCase } from '@/domain/lease-management/application/use-cases/renew-lease'
import { LeaseNotFoundError } from '@/domain/lease-management/application/use-cases/errors/lease-not-found-error'
import { LeaseRenewalInvalidSourceError } from '@/domain/lease-management/application/use-cases/errors/lease-renewal-invalid-source-error'
import { LeaseRenewalStartDateInvalidError } from '@/domain/lease-management/application/use-cases/errors/lease-renewal-start-date-invalid-error'
import { LeaseRenewalAlreadyExistsError } from '@/domain/lease-management/application/use-cases/errors/lease-renewal-already-exists-error'
import {
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
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
import { renewLeaseSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { HttpLeasePresenter } from '../../presenters/http-lease-presenter'
import { z } from 'zod'

type RenewLeaseBody = z.infer<typeof renewLeaseSchema>

const bodyValidationPipe = new ZodValidationPipe(renewLeaseSchema)

@ApiTags('Leases')
@Controller('/leases')
export class RenewLeaseController {
	constructor(private renewLease: RenewLeaseUseCase) {}

	private errorMap = {
		[LeaseNotFoundError.name]: NotFoundException,
		[LeaseRenewalInvalidSourceError.name]: BadRequestException,
		[LeaseRenewalStartDateInvalidError.name]: BadRequestException,
		[LeaseRenewalAlreadyExistsError.name]: ConflictException,
	}

	@Post(':id/renew')
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Renew a lease' })
	@ApiParam({ name: 'id', description: 'Original Lease UUID' })
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: 'Renewal lease created',
	})
	async handle(
		@Param('id') leaseId: string,
		@Body(bodyValidationPipe) body: RenewLeaseBody,
	) {
		const response = await this.renewLease.execute({
			leaseId,
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
