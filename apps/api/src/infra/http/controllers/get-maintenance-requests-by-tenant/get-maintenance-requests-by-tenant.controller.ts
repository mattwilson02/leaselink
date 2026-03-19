import { GetMaintenanceRequestsByTenantUseCase } from '@/domain/maintenance/application/use-cases/get-maintenance-requests-by-tenant'
import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from 'nestjs-zod'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpMaintenanceRequestPresenter } from '../../presenters/http-maintenance-request-presenter'

const querySchema = z.object({
	status: z.string().optional(),
	page: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce.number().int().positive().max(100).default(20),
})

type TenantRequestsQuery = z.infer<typeof querySchema>

const queryValidationPipe = new ZodValidationPipe(querySchema)

@ApiTags('Maintenance Requests')
@Controller('/maintenance-requests')
export class GetMaintenanceRequestsByTenantController {
	constructor(
		private getMaintenanceRequestsByTenant: GetMaintenanceRequestsByTenantUseCase,
	) {}

	@Get('tenant')
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get current tenant's maintenance requests" })
	@ApiQuery({ name: 'status', required: false })
	@ApiQuery({ name: 'page', required: false, type: Number })
	@ApiQuery({ name: 'pageSize', required: false, type: Number })
	@ApiResponse({ status: 200, description: "Tenant's maintenance requests" })
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Query(queryValidationPipe) query: TenantRequestsQuery,
	) {
		if (user.type !== 'CLIENT') {
			throw new UnauthorizedException('Only tenants can access this endpoint')
		}

		const response = await this.getMaintenanceRequestsByTenant.execute({
			tenantId: user.id,
			status: query.status,
			page: query.page,
			pageSize: query.pageSize,
		})

		return {
			maintenanceRequests: HttpMaintenanceRequestPresenter.toHTTPList(
				response.value.requests,
			),
			totalCount: response.value.totalCount,
		}
	}
}
