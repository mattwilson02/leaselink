import { GetLeaseByIdUseCase } from '@/domain/lease-management/application/use-cases/get-lease-by-id'
import { LeaseForbiddenError } from '@/domain/lease-management/application/use-cases/errors/lease-forbidden-error'
import {
	Controller,
	ForbiddenException,
	Get,
	HttpStatus,
	NotFoundException,
	Param,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpLeasePresenter } from '../../presenters/http-lease-presenter'

@ApiTags('Leases')
@Controller('/leases')
export class GetLeaseByIdController {
	constructor(private getLeaseById: GetLeaseByIdUseCase) {}

	@Get(':id')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get lease by ID' })
	@ApiParam({ name: 'id', description: 'Lease UUID' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Lease details' })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lease not found' })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
	async handle(
		@Param('id') leaseId: string,
		@CurrentUser() user: HttpUserResponse,
	) {
		const response = await this.getLeaseById.execute({
			leaseId,
			requestingUserId: user.id,
			requestingUserType: user.type as 'CLIENT' | 'EMPLOYEE',
		})

		if (response.isLeft()) {
			const error = response.value
			if (error instanceof LeaseForbiddenError) {
				throw new ForbiddenException(error.message)
			}
			throw new NotFoundException(error.message)
		}

		return {
			data: HttpLeasePresenter.toHTTP(response.value.lease),
		}
	}
}
