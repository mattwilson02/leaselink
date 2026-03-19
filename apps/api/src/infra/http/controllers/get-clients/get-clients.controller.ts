import { GetClientsUseCase } from '@/domain/financial-management/application/use-cases/get-clients'
import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { tenantFilterSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { HttpClientPresenter } from '../../presenters/http-client-presenter'
import { z } from 'zod'

type TenantFilterQuery = z.infer<typeof tenantFilterSchema>

const queryValidationPipe = new ZodValidationPipe(tenantFilterSchema)

@ApiTags('Tenants')
@Controller('/tenants')
export class GetClientsController {
	constructor(private getClients: GetClientsUseCase) {}

	@Get()
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'List all tenants' })
	@ApiQuery({
		name: 'status',
		required: false,
		enum: ['INVITED', 'ACTIVE', 'INACTIVE'],
	})
	@ApiQuery({ name: 'onboardingStatus', required: false })
	@ApiQuery({ name: 'search', required: false })
	@ApiQuery({ name: 'page', required: false, example: 1 })
	@ApiQuery({ name: 'pageSize', required: false, example: 20 })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Paginated list of tenants',
	})
	async handle(@Query(queryValidationPipe) query: TenantFilterQuery) {
		const response = await this.getClients.execute({
			status: query.status,
			onboardingStatus: query.onboardingStatus,
			search: query.search,
			page: query.page,
			pageSize: query.pageSize,
		})

		if (response.isLeft()) {
			throw response.value
		}

		const { clients, totalCount } = response.value

		return {
			data: HttpClientPresenter.toHTTPList(clients),
			meta: {
				page: query.page,
				pageSize: query.pageSize,
				totalCount,
				totalPages: Math.ceil(totalCount / query.pageSize),
			},
		}
	}
}
