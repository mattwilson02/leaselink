import { UpdateVendorUseCase } from '@/domain/expense-management/application/use-cases/update-vendor'
import { VendorNotFoundError } from '@/domain/expense-management/application/use-cases/errors/vendor-not-found-error'
import { CreateAuditLogUseCase } from '@/domain/audit/application/use-cases/create-audit-log'
import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Optional,
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
import { updateVendorSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpVendorPresenter } from '../../presenters/http-vendor-presenter'
import { z } from 'zod'

type UpdateVendorBody = z.infer<typeof updateVendorSchema>
const bodyValidationPipe = new ZodValidationPipe(updateVendorSchema)

@ApiTags('Vendors')
@Controller('/vendors')
export class UpdateVendorController {
	constructor(
		private updateVendor: UpdateVendorUseCase,
		@Optional() private createAuditLog?: CreateAuditLogUseCase,
	) {}

	@Put(':id')
	@HttpCode(HttpStatus.OK)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Update a vendor' })
	@ApiParam({ name: 'id', description: 'Vendor UUID' })
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				name: { type: 'string' },
				specialty: { type: 'string' },
				phone: { type: 'string', nullable: true },
				email: { type: 'string', nullable: true },
				notes: { type: 'string', nullable: true },
			},
		},
	})
	@ApiResponse({ status: HttpStatus.OK, description: 'Vendor updated' })
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Vendor not found',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') vendorId: string,
		@Body(bodyValidationPipe) body: UpdateVendorBody,
	) {
		const response = await this.updateVendor.execute({
			vendorId,
			managerId: user.id,
			name: body.name,
			specialty: body.specialty,
			phone: body.phone,
			email:
				typeof body.email === 'string' && body.email === '' ? null : body.email,
			notes: body.notes,
		})

		if (response.isLeft()) {
			const error = response.value
			const errorMap: Record<string, any> = {
				[VendorNotFoundError.name]: NotFoundException,
			}
			const ExceptionClass =
				errorMap[error.constructor.name] ?? BadRequestException
			throw new ExceptionClass(error.message)
		}

		const result = {
			vendor: HttpVendorPresenter.toHTTP(response.value.vendor),
		}

		this.createAuditLog
			?.execute({
				actorId: user.id,
				actorType: 'EMPLOYEE',
				action: 'UPDATE',
				resourceType: 'VENDOR',
				resourceId: vendorId,
				metadata: { ...body },
			})
			.catch((err) => console.error('Audit log failed:', err))

		return result
	}
}
