import { DeleteVendorUseCase } from '@/domain/expense-management/application/use-cases/delete-vendor'
import { VendorNotFoundError } from '@/domain/expense-management/application/use-cases/errors/vendor-not-found-error'
import { VendorHasAssignedRequestsError } from '@/domain/expense-management/application/use-cases/errors/vendor-has-assigned-requests-error'
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

@ApiTags('Vendors')
@Controller('/vendors')
export class DeleteVendorController {
	constructor(
		private deleteVendor: DeleteVendorUseCase,
		@Optional() private createAuditLog?: CreateAuditLogUseCase,
	) {}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Delete a vendor' })
	@ApiParam({ name: 'id', description: 'Vendor UUID' })
	@ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Vendor deleted' })
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Vendor not found',
	})
	@ApiResponse({
		status: HttpStatus.CONFLICT,
		description: 'Vendor has open maintenance requests',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') vendorId: string,
	) {
		const response = await this.deleteVendor.execute({
			vendorId,
			managerId: user.id,
		})

		if (response.isLeft()) {
			const error = response.value
			const errorMap: Record<string, any> = {
				[VendorNotFoundError.name]: NotFoundException,
				[VendorHasAssignedRequestsError.name]: ConflictException,
			}
			const ExceptionClass =
				errorMap[error.constructor.name] ?? NotFoundException
			throw new ExceptionClass(error.message)
		}

		this.createAuditLog
			?.execute({
				actorId: user.id,
				actorType: 'EMPLOYEE',
				action: 'DELETE',
				resourceType: 'VENDOR',
				resourceId: vendorId,
				metadata: {},
			})
			.catch((err) => console.error('Audit log failed:', err))
	}
}
