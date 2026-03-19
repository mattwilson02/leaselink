import { GetMaintenanceRequestsUseCase } from '@/domain/maintenance/application/use-cases/get-maintenance-requests'
import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { maintenanceRequestFilterSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpMaintenanceRequestPresenter } from '../../presenters/http-maintenance-request-presenter'
import { z } from 'zod'

type MaintenanceRequestFilterQuery = z.infer<
	typeof maintenanceRequestFilterSchema
>

const queryValidationPipe = new ZodValidationPipe(
	maintenanceRequestFilterSchema,
)

@ApiTags('Maintenance Requests')
@Controller('/maintenance-requests')
export class GetMaintenanceRequestsController {
	constructor(private getMaintenanceRequests: GetMaintenanceRequestsUseCase) {}

	@Get()
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get maintenance requests (manager only)' })
	@ApiQuery({ name: 'status', required: false })
	@ApiQuery({ name: 'priority', required: false })
	@ApiQuery({ name: 'category', required: false })
	@ApiQuery({ name: 'propertyId', required: false })
	@ApiQuery({ name: 'page', required: false, type: Number })
	@ApiQuery({ name: 'pageSize', required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Paginated list of requests' })
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Query(queryValidationPipe) query: MaintenanceRequestFilterQuery,
	) {
		const response = await this.getMaintenanceRequests.execute({
			managerId: user.id,
			status: query.status,
			priority: query.priority,
			category: query.category,
			propertyId: query.propertyId,
			page: query.page ?? 1,
			pageSize: query.pageSize ?? 20,
		})

		return {
			maintenanceRequests: HttpMaintenanceRequestPresenter.toHTTPList(
				response.value.requests,
			),
			totalCount: response.value.totalCount,
		}
	}
}
