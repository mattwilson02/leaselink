import { GetClientByIdUseCase } from '@/domain/financial-management/application/use-cases/get-client-by-id'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import {
	Controller,
	Get,
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
import { HttpClientPresenter } from '../../presenters/http-client-presenter'

@ApiTags('Tenants')
@Controller('/tenants')
export class GetClientByIdController {
	constructor(private getClientById: GetClientByIdUseCase) {}

	private errorMap: Record<string, any> = {
		[ClientNotFoundError.name]: NotFoundException,
	}

	@Get(':id')
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get tenant by ID' })
	@ApiParam({ name: 'id', description: 'Tenant UUID' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Tenant details' })
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Tenant not found',
	})
	async handle(@Param('id') clientId: string) {
		const response = await this.getClientById.execute({ clientId })

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || NotFoundException
			throw new exception(error.message)
		}

		return {
			data: HttpClientPresenter.toHTTP(response.value.client),
		}
	}
}
