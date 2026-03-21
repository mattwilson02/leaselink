import { CreatePropertyUseCase } from '@/domain/property-management/application/use-cases/create-property'
import { CreateAuditLogUseCase } from '@/domain/audit/application/use-cases/create-audit-log'
import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Optional,
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
	constructor(
		private createProperty: CreatePropertyUseCase,
		@Optional() private createAuditLog?: CreateAuditLogUseCase,
	) {}

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

		const result = {
			property: HttpPropertyPresenter.toHTTP(response.value.property),
		}

		this.createAuditLog
			?.execute({
				actorId: user.id,
				actorType: 'EMPLOYEE',
				action: 'CREATE',
				resourceType: 'PROPERTY',
				resourceId: response.value.property.id.toString(),
				metadata: { address: body.address },
			})
			.catch((err) => console.error('Audit log failed:', err))

		return result
	}
}
