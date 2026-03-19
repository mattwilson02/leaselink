import { UpdatePropertyUseCase } from '@/domain/property-management/application/use-cases/update-property'
import { PropertyNotFoundError } from '@/domain/property-management/application/use-cases/errors/property-not-found-error'
import {
	Body,
	Controller,
	HttpStatus,
	NotFoundException,
	Param,
	Put,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { updatePropertySchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpPropertyPresenter } from '../../presenters/http-property-presenter'
import { UpdatePropertyRequestDTO } from '../../DTOs/property/update-property-request-dto'
import { z } from 'zod'

type UpdatePropertyBody = z.infer<typeof updatePropertySchema>

const bodyValidationPipe = new ZodValidationPipe(updatePropertySchema)

@ApiTags('Properties')
@Controller('/properties')
export class UpdatePropertyController {
	constructor(private updateProperty: UpdatePropertyUseCase) {}

	private errorMap: Record<string, any> = {
		[PropertyNotFoundError.name]: NotFoundException,
	}

	@Put(':id')
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Update property details' })
	@ApiParam({ name: 'id', description: 'Property UUID' })
	@ApiBody({ type: UpdatePropertyRequestDTO })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Property updated',
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Property not found',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') propertyId: string,
		@Body(bodyValidationPipe) body: UpdatePropertyBody,
	) {
		const response = await this.updateProperty.execute({
			propertyId,
			managerId: user.id,
			...body,
		})

		if (response.isLeft()) {
			const error = response.value
			const exception =
				this.errorMap[error.constructor.name] || NotFoundException
			throw new exception(error.message)
		}

		return {
			property: HttpPropertyPresenter.toHTTP(response.value.property),
		}
	}
}
