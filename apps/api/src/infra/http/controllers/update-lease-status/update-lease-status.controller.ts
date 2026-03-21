import { UpdateLeaseStatusUseCase } from '@/domain/lease-management/application/use-cases/update-lease-status'
import { LeaseNotFoundError } from '@/domain/lease-management/application/use-cases/errors/lease-not-found-error'
import { InvalidLeaseStatusTransitionError } from '@/domain/lease-management/application/use-cases/errors/invalid-lease-status-transition-error'
import { LeaseActivationFutureStartError } from '@/domain/lease-management/application/use-cases/errors/lease-activation-future-start-error'
import { CreateAuditLogUseCase } from '@/domain/audit/application/use-cases/create-audit-log'
import {
	BadRequestException,
	Body,
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
import { updateLeaseStatusSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpLeasePresenter } from '../../presenters/http-lease-presenter'
import { z } from 'zod'

type UpdateLeaseStatusBody = z.infer<typeof updateLeaseStatusSchema>

const bodyValidationPipe = new ZodValidationPipe(updateLeaseStatusSchema)

@ApiTags('Leases')
@Controller('/leases')
export class UpdateLeaseStatusController {
	constructor(
		private updateLeaseStatus: UpdateLeaseStatusUseCase,
		@Optional() private createAuditLog?: CreateAuditLogUseCase,
	) {}

	private errorMap: Record<string, any> = {
		[LeaseNotFoundError.name]: NotFoundException,
		[InvalidLeaseStatusTransitionError.name]: BadRequestException,
		[LeaseActivationFutureStartError.name]: BadRequestException,
	}

	@Patch(':id/status')
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Update lease status' })
	@ApiParam({ name: 'id', description: 'Lease UUID' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Lease status updated' })
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') leaseId: string,
		@Body(bodyValidationPipe) body: UpdateLeaseStatusBody,
	) {
		const response = await this.updateLeaseStatus.execute({
			leaseId,
			status: body.status,
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
				action: 'STATUS_CHANGE',
				resourceType: 'LEASE',
				resourceId: leaseId,
				metadata: { to: body.status },
			})
			.catch((err) => console.error('Audit log failed:', err))

		return result
	}
}
