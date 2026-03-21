import { GetExpenseSummaryUseCase } from '@/domain/expense-management/application/use-cases/get-expense-summary'
import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Query,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { ZodValidationPipe } from 'nestjs-zod'
import { expenseSummaryFilterSchema } from '@leaselink/shared'
import { z } from 'zod'

type SummaryFilterQuery = z.infer<typeof expenseSummaryFilterSchema>
const queryValidationPipe = new ZodValidationPipe(expenseSummaryFilterSchema)

@ApiTags('Expenses')
@Controller('/expenses')
export class GetExpenseSummaryController {
	constructor(private getExpenseSummary: GetExpenseSummaryUseCase) {}

	@Get('summary')
	@HttpCode(HttpStatus.OK)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get expense summary by property' })
	@ApiQuery({ name: 'startDate', required: false })
	@ApiQuery({ name: 'endDate', required: false })
	@ApiResponse({ status: HttpStatus.OK, description: 'Expense summary' })
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Query(queryValidationPipe) query: SummaryFilterQuery,
	) {
		const response = await this.getExpenseSummary.execute({
			managerId: user.id,
			startDate: query.startDate ? new Date(query.startDate) : undefined,
			endDate: query.endDate ? new Date(query.endDate) : undefined,
		})

		if (response.isLeft()) {
			throw response.value
		}

		return { summary: response.value.summary }
	}
}
