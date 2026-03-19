import { GetLeasesUseCase } from '@/domain/lease-management/application/use-cases/get-leases'
import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { leaseFilterSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { HttpLeasePresenter } from '../../presenters/http-lease-presenter'
import { z } from 'zod'

type LeaseFilterQuery = z.infer<typeof leaseFilterSchema>

const queryValidationPipe = new ZodValidationPipe(leaseFilterSchema)

@ApiTags('Leases')
@Controller('/leases')
export class GetLeasesController {
	constructor(private getLeases: GetLeasesUseCase) {}

	@Get()
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'List all leases' })
	@ApiQuery({
		name: 'status',
		required: false,
		enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED'],
	})
	@ApiQuery({ name: 'propertyId', required: false })
	@ApiQuery({ name: 'tenantId', required: false })
	@ApiQuery({ name: 'page', required: false, example: 1 })
	@ApiQuery({ name: 'pageSize', required: false, example: 20 })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Paginated list of leases',
	})
	async handle(@Query(queryValidationPipe) query: LeaseFilterQuery) {
		const response = await this.getLeases.execute({
			status: query.status,
			propertyId: query.propertyId,
			tenantId: query.tenantId,
			page: query.page,
			pageSize: query.pageSize,
		})

		if (response.isLeft()) {
			throw response.value
		}

		const { leases, totalCount } = response.value

		return {
			data: HttpLeasePresenter.toHTTPList(leases),
			meta: {
				page: query.page,
				pageSize: query.pageSize,
				totalCount,
				totalPages: Math.ceil(totalCount / query.pageSize),
			},
		}
	}
}
