import { MarkOverduePaymentsUseCase } from '@/domain/payment/application/use-cases/mark-overdue-payments'
import {
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'

@ApiTags('Payments')
@Controller('/payments')
export class MarkOverduePaymentsController {
	constructor(private markOverduePayments: MarkOverduePaymentsUseCase) {}

	@Post('mark-overdue')
	@HttpCode(HttpStatus.OK)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Mark eligible payments as overdue (manager only)' })
	@ApiResponse({ status: 200, description: 'Overdue count returned' })
	async handle() {
		const response = await this.markOverduePayments.execute()

		return {
			overdueCount: response.value.overdueCount,
		}
	}
}
