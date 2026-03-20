import { GetLeasesUseCase } from '@/domain/lease-management/application/use-cases/get-leases'
import { PropertiesRepository } from '@/domain/property-management/application/repositories/properties-repository'
import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { leaseFilterSchema } from '@leaselink/shared'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpLeasePresenter } from '../../presenters/http-lease-presenter'
import { z } from 'zod'

type LeaseFilterQuery = z.infer<typeof leaseFilterSchema>

const queryValidationPipe = new ZodValidationPipe(leaseFilterSchema)

@ApiTags('Leases')
@Controller('/leases')
export class GetLeasesByTenantController {
	constructor(
		private getLeases: GetLeasesUseCase,
		private propertiesRepository: PropertiesRepository,
	) {}

	@Get('tenant')
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get tenant's own leases" })
	@ApiQuery({
		name: 'status',
		required: false,
		enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED'],
	})
	@ApiQuery({ name: 'page', required: false, example: 1 })
	@ApiQuery({ name: 'pageSize', required: false, example: 20 })
	@ApiResponse({
		status: 200,
		description: "Paginated list of tenant's leases with property data",
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Query(queryValidationPipe) query: LeaseFilterQuery,
	) {
		if (user.type !== 'CLIENT') {
			throw new UnauthorizedException('Only tenants can access this endpoint')
		}

		const response = await this.getLeases.execute({
			tenantId: user.id,
			status: query.status,
			page: query.page,
			pageSize: query.pageSize,
		})

		if (response.isLeft()) {
			throw response.value
		}

		const { leases, totalCount } = response.value

		const leasesWithProperty = await Promise.all(
			leases.map(async (lease) => {
				const leaseHttp = HttpLeasePresenter.toHTTP(lease)
				const property = await this.propertiesRepository.findById(
					lease.propertyId.toString(),
				)
				return {
					...leaseHttp,
					property: property
						? {
								id: property.id.toString(),
								address: property.address,
								city: property.city,
								state: property.state,
								zipCode: property.zipCode,
								propertyType: property.propertyType,
							}
						: null,
				}
			}),
		)

		return {
			data: leasesWithProperty,
			meta: {
				page: query.page,
				pageSize: query.pageSize,
				totalCount,
				totalPages: Math.ceil(totalCount / query.pageSize),
			},
		}
	}
}
