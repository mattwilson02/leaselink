import { CreateVendorUseCase } from '@/domain/expense-management/application/use-cases/create-vendor'
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
import { createVendorSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpVendorPresenter } from '../../presenters/http-vendor-presenter'
import { z } from 'zod'

type CreateVendorBody = z.infer<typeof createVendorSchema>
const bodyValidationPipe = new ZodValidationPipe(createVendorSchema)

@ApiTags('Vendors')
@Controller('/vendors')
export class CreateVendorController {
	constructor(
		private createVendor: CreateVendorUseCase,
		@Optional() private createAuditLog?: CreateAuditLogUseCase,
	) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Create a new vendor' })
	@ApiBody({
		schema: {
			type: 'object',
			required: ['name', 'specialty'],
			properties: {
				name: { type: 'string' },
				specialty: { type: 'string' },
				phone: { type: 'string' },
				email: { type: 'string' },
				notes: { type: 'string' },
			},
		},
	})
	@ApiResponse({ status: HttpStatus.CREATED, description: 'Vendor created' })
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Body(bodyValidationPipe) body: CreateVendorBody,
	) {
		const response = await this.createVendor.execute({
			managerId: user.id,
			name: body.name,
			specialty: body.specialty,
			phone: body.phone,
			email: body.email || undefined,
			notes: body.notes,
		})

		if (response.isLeft()) {
			throw response.value
		}

		const result = { vendor: HttpVendorPresenter.toHTTP(response.value.vendor) }

		this.createAuditLog
			?.execute({
				actorId: user.id,
				actorType: 'EMPLOYEE',
				action: 'CREATE',
				resourceType: 'VENDOR',
				resourceId: response.value.vendor.id.toString(),
				metadata: { name: body.name },
			})
			.catch((err) => console.error('Audit log failed:', err))

		return result
	}
}
