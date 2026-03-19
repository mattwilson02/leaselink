import { GetMaintenanceRequestsByPropertyUseCase } from '@/domain/maintenance/application/use-cases/get-maintenance-requests-by-property'
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { HttpMaintenanceRequestPresenter } from '../../presenters/http-maintenance-request-presenter'

const querySchema = z.object({
	status: z.string().optional(),
	page: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce.number().int().positive().max(100).default(20),
})

type PropertyRequestsQuery = z.infer<typeof querySchema>

const queryValidationPipe = new ZodValidationPipe(querySchema)

@ApiTags('Maintenance Requests')
@Controller('/properties')
export class GetMaintenanceRequestsByPropertyController {
	constructor(
		private getMaintenanceRequestsByProperty: GetMaintenanceRequestsByPropertyUseCase,
	) {}

	@Get(':propertyId/maintenance-requests')
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Get maintenance requests for a property (manager only)',
	})
	@ApiParam({ name: 'propertyId', description: 'Property UUID' })
	@ApiQuery({ name: 'status', required: false })
	@ApiQuery({ name: 'page', required: false, type: Number })
	@ApiQuery({ name: 'pageSize', required: false, type: Number })
	@ApiResponse({
		status: 200,
		description: 'Maintenance requests for property',
	})
	async handle(
		@Param('propertyId') propertyId: string,
		@Query(queryValidationPipe) query: PropertyRequestsQuery,
	) {
		const response = await this.getMaintenanceRequestsByProperty.execute({
			propertyId,
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
