import { GetLeaseByPropertyUseCase } from '@/domain/lease-management/application/use-cases/get-lease-by-property'
import { Controller, Get, HttpStatus, Param, UseGuards } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { HttpLeasePresenter } from '../../presenters/http-lease-presenter'

@ApiTags('Leases')
@Controller('/properties')
export class GetLeaseByPropertyController {
	constructor(private getLeaseByProperty: GetLeaseByPropertyUseCase) {}

	@Get(':propertyId/active-lease')
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get active lease for a property' })
	@ApiParam({ name: 'propertyId', description: 'Property UUID' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Active lease for the property, or null if none',
	})
	async handle(@Param('propertyId') propertyId: string) {
		const response = await this.getLeaseByProperty.execute({ propertyId })

		if (response.isLeft()) {
			throw response.value
		}

		const { lease } = response.value

		return {
			data: lease ? HttpLeasePresenter.toHTTP(lease) : null,
		}
	}
}
