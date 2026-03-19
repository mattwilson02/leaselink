import { CreatePropertyUseCase } from '@/domain/property-management/application/use-cases/create-property'
import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { createPropertySchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpPropertyPresenter } from '../../presenters/http-property-presenter'
import { CreatePropertyRequestDTO } from '../../DTOs/property/create-property-request-dto'
import { z } from 'zod'

type CreatePropertyBody = z.infer<typeof createPropertySchema>

const bodyValidationPipe = new ZodValidationPipe(createPropertySchema)

@ApiTags('Properties')
@Controller('/properties')
export class CreatePropertyController {
	constructor(private createProperty: CreatePropertyUseCase) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Create a new property' })
	@ApiBody({ type: CreatePropertyRequestDTO })
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: 'Property created',
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Invalid request',
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Not authenticated',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Body(bodyValidationPipe) body: CreatePropertyBody,
	) {
		const response = await this.createProperty.execute({
			managerId: user.id,
			...body,
		})

		if (response.isLeft()) {
			throw response.value
		}

		return {
			property: HttpPropertyPresenter.toHTTP(response.value.property),
		}
	}
}
