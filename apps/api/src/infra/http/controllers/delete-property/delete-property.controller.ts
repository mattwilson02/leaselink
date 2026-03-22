import { DeletePropertyUseCase } from '@/domain/property-management/application/use-cases/delete-property'
import { PropertyNotFoundError } from '@/domain/property-management/application/use-cases/errors/property-not-found-error'
import { PropertyHasActiveLeaseError } from '@/domain/property-management/application/use-cases/errors/property-has-active-lease-error'
import { CreateAuditLogUseCase } from '@/domain/audit/application/use-cases/create-audit-log'
import {
	ConflictException,
	Controller,
	Delete,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Optional,
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
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'

@ApiTags('Properties')
@Controller('/properties')
export class DeletePropertyController {
	constructor(
		private deleteProperty: DeletePropertyUseCase,
		@Optional() private createAuditLog?: CreateAuditLogUseCase,
	) {}

	private errorMap = {
		[PropertyNotFoundError.name]: NotFoundException,
		[PropertyHasActiveLeaseError.name]: ConflictException,
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Delete a property' })
	@ApiParam({ name: 'id', description: 'Property UUID' })
	@ApiResponse({
		status: HttpStatus.NO_CONTENT,
		description: 'Property deleted',
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
	) {
		const response = await this.deleteProperty.execute({
			propertyId,
			managerId: user.id,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || NotFoundException
			throw new exception(error.message)
		}

		this.createAuditLog
			?.execute({
				actorId: user.id,
				actorType: 'EMPLOYEE',
				action: 'DELETE',
				resourceType: 'PROPERTY',
				resourceId: propertyId,
			})
			.catch((err) => console.error('Audit log failed:', err))
	}
}
