import { GetPropertyByIdUseCase } from '@/domain/property-management/application/use-cases/get-property-by-id'
import { PropertyNotFoundError } from '@/domain/property-management/application/use-cases/errors/property-not-found-error'
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
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import type { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpPropertyPresenter } from '../../presenters/http-property-presenter'
import { EnvService } from '@/infra/env/env.service'

@ApiTags('Properties')
@Controller('/properties')
export class GetPropertyByIdController {
	private blobBaseUrl: string

	constructor(
		private getPropertyById: GetPropertyByIdUseCase,
		private envService: EnvService,
	) {
		const endpoint = this.envService.get('BLOB_STORAGE_ENDPOINT')
		const container = this.envService.get('BLOB_STORAGE_CONTAINER_NAME')
		this.blobBaseUrl = `${endpoint}/${container}`
	}

	private errorMap: Record<string, any> = {
		[PropertyNotFoundError.name]: NotFoundException,
	}

	@Get(':id')
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get property details by ID' })
	@ApiParam({ name: 'id', description: 'Property UUID' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Property details',
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Property not found',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') propertyId: string,
	) {
		const response = await this.getPropertyById.execute({
			propertyId,
			managerId: user.id,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || NotFoundException
			throw new exception(error.message)
		}

		return {
			property: HttpPropertyPresenter.toHTTP(response.value.property, this.blobBaseUrl),
		}
	}
}
