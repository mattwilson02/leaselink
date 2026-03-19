import { GetLeaseByIdUseCase } from '@/domain/lease-management/application/use-cases/get-lease-by-id'
import { LeaseNotFoundError } from '@/domain/lease-management/application/use-cases/errors/lease-not-found-error'
import {
	Controller,
	Get,
	HttpStatus,
	NotFoundException,
	Param,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { HttpLeasePresenter } from '../../presenters/http-lease-presenter'

@ApiTags('Leases')
@Controller('/leases')
export class GetLeaseByIdController {
	constructor(private getLeaseById: GetLeaseByIdUseCase) {}

	private errorMap: Record<string, any> = {
		[LeaseNotFoundError.name]: NotFoundException,
	}

	@Get(':id')
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get lease by ID' })
	@ApiParam({ name: 'id', description: 'Lease UUID' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Lease details' })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lease not found' })
	async handle(@Param('id') leaseId: string) {
		const response = await this.getLeaseById.execute({ leaseId })

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || NotFoundException
			throw new exception(error.message)
		}

		return {
			data: HttpLeasePresenter.toHTTP(response.value.lease),
		}
	}
}
