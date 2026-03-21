import { GetVendorByIdUseCase } from '@/domain/expense-management/application/use-cases/get-vendor-by-id'
import { VendorNotFoundError } from '@/domain/expense-management/application/use-cases/errors/vendor-not-found-error'
import {
	Controller,
	Get,
	HttpCode,
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
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpVendorPresenter } from '../../presenters/http-vendor-presenter'

@ApiTags('Vendors')
@Controller('/vendors')
export class GetVendorByIdController {
	constructor(private getVendorById: GetVendorByIdUseCase) {}

	@Get(':id')
	@HttpCode(HttpStatus.OK)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get vendor by ID' })
	@ApiParam({ name: 'id', description: 'Vendor UUID' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Vendor found' })
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Vendor not found',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') vendorId: string,
	) {
		const response = await this.getVendorById.execute({
			vendorId,
			managerId: user.id,
		})

		if (response.isLeft()) {
			const error = response.value
			const errorMap = {
				[VendorNotFoundError.name]: NotFoundException,
			}
			const exceptionClass =
				errorMap[error.constructor.name] ?? NotFoundException
			throw new exceptionClass(error.message)
		}

		return { vendor: HttpVendorPresenter.toHTTP(response.value.vendor) }
	}
}
