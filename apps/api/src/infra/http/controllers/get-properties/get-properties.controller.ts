import { GetPropertiesByManagerUseCase } from '@/domain/property-management/application/use-cases/get-properties-by-manager'
import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { propertyFilterSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpPropertyPresenter } from '../../presenters/http-property-presenter'
import { z } from 'zod'

type PropertyFilterQuery = z.infer<typeof propertyFilterSchema>

const queryValidationPipe = new ZodValidationPipe(propertyFilterSchema)

@ApiTags('Properties')
@Controller('/properties')
export class GetPropertiesController {
	constructor(private getProperties: GetPropertiesByManagerUseCase) {}

	@Get()
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'List properties for the authenticated manager',
	})
	@ApiQuery({
		name: 'status',
		required: false,
		enum: ['VACANT', 'LISTED', 'OCCUPIED', 'MAINTENANCE'],
	})
	@ApiQuery({ name: 'search', required: false })
	@ApiQuery({ name: 'page', required: false, example: 1 })
	@ApiQuery({ name: 'pageSize', required: false, example: 20 })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Paginated list of properties',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Query(queryValidationPipe) query: PropertyFilterQuery,
	) {
		const response = await this.getProperties.execute({
			managerId: user.id,
			status: query.status,
			search: query.search,
			page: query.page,
			pageSize: query.pageSize,
		})

		if (response.isLeft()) {
			throw response.value
		}

		const { properties, totalCount } = response.value

		return {
			data: HttpPropertyPresenter.toHTTPList(properties),
			meta: {
				page: query.page,
				pageSize: query.pageSize,
				totalCount,
				totalPages: Math.ceil(totalCount / query.pageSize),
			},
		}
	}
}
