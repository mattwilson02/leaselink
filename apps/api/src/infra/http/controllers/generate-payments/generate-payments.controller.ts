import { GenerateLeasePaymentsUseCase } from '@/domain/payment/application/use-cases/generate-lease-payments'
import { PaymentNoActiveLeaseError } from '@/domain/payment/application/use-cases/errors/payment-no-active-lease-error'
import {
	BadRequestException,
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
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { z } from 'zod'
import { ZodValidationPipe } from 'nestjs-zod'

const generatePaymentsSchema = z.object({
	leaseId: z.string().uuid(),
})

type GeneratePaymentsBody = z.infer<typeof generatePaymentsSchema>

const bodyValidationPipe = new ZodValidationPipe(generatePaymentsSchema)

@ApiTags('Payments')
@Controller('/payments')
export class GeneratePaymentsController {
	constructor(private generateLeasePayments: GenerateLeasePaymentsUseCase) {}

	@Post('generate')
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Generate payment records for a lease (manager only)',
	})
	@ApiBody({
		schema: {
			type: 'object',
			required: ['leaseId'],
			properties: {
				leaseId: { type: 'string', format: 'uuid' },
			},
		},
	})
	@ApiResponse({ status: 201, description: 'Payments generated' })
	@ApiResponse({ status: 400, description: 'Lease not active' })
	async handle(@Body(bodyValidationPipe) body: GeneratePaymentsBody) {
		const response = await this.generateLeasePayments.execute({
			leaseId: body.leaseId,
		})

		if (response.isLeft()) {
			const error = response.value
			if (error instanceof PaymentNoActiveLeaseError) {
				throw new BadRequestException(error.message)
			}
			throw new BadRequestException('Failed to generate payments')
		}

		return {
			paymentsGenerated: response.value.payments.length,
		}
	}
}
