import { GetVendorsUseCase } from '@/domain/expense-management/application/use-cases/get-vendors'
import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Query,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { vendorFilterSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpVendorPresenter } from '../../presenters/http-vendor-presenter'
import { z } from 'zod'

type VendorFilterQuery = z.infer<typeof vendorFilterSchema>
const queryValidationPipe = new ZodValidationPipe(vendorFilterSchema)

@ApiTags('Vendors')
@Controller('/vendors')
export class GetVendorsController {
	constructor(private getVendors: GetVendorsUseCase) {}

	@Get()
	@HttpCode(HttpStatus.OK)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get vendors' })
	@ApiQuery({ name: 'specialty', required: false })
	@ApiQuery({ name: 'search', required: false })
	@ApiQuery({ name: 'page', required: false })
	@ApiQuery({ name: 'pageSize', required: false })
	@ApiResponse({ status: HttpStatus.OK, description: 'Vendors list' })
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Query(queryValidationPipe) query: VendorFilterQuery,
	) {
		const response = await this.getVendors.execute({
			managerId: user.id,
			specialty: query.specialty,
			search: query.search,
			page: query.page,
			pageSize: query.pageSize,
		})

		if (response.isLeft()) {
			throw response.value
		}

		const { vendors, totalCount } = response.value
		const totalPages = Math.ceil(totalCount / query.pageSize)

		return {
			data: HttpVendorPresenter.toHTTPList(vendors),
			meta: {
				page: query.page,
				pageSize: query.pageSize,
				totalCount,
				totalPages,
			},
		}
	}
}
