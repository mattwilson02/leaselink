import { GetExpensesUseCase } from '@/domain/expense-management/application/use-cases/get-expenses'
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
import { ZodValidationPipe } from 'nestjs-zod'
import { expenseFilterSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpExpensePresenter } from '../../presenters/http-expense-presenter'
import { z } from 'zod'

type ExpenseFilterQuery = z.infer<typeof expenseFilterSchema>
const queryValidationPipe = new ZodValidationPipe(expenseFilterSchema)

@ApiTags('Expenses')
@Controller('/expenses')
export class GetExpensesController {
	constructor(private getExpenses: GetExpensesUseCase) {}

	@Get()
	@HttpCode(HttpStatus.OK)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get expenses with filters' })
	@ApiQuery({ name: 'propertyId', required: false })
	@ApiQuery({ name: 'category', required: false })
	@ApiQuery({ name: 'dateFrom', required: false })
	@ApiQuery({ name: 'dateTo', required: false })
	@ApiQuery({ name: 'page', required: false })
	@ApiQuery({ name: 'pageSize', required: false })
	@ApiResponse({ status: HttpStatus.OK, description: 'Expenses list' })
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Query(queryValidationPipe) query: ExpenseFilterQuery,
	) {
		const response = await this.getExpenses.execute({
			managerId: user.id,
			propertyId: query.propertyId,
			category: query.category,
			dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
			dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
			page: query.page,
			pageSize: query.pageSize,
		})

		if (response.isLeft()) {
			throw response.value
		}

		const { expenses, totalCount } = response.value
		const totalPages = Math.ceil(totalCount / query.pageSize)

		return {
			data: HttpExpensePresenter.toHTTPList(expenses),
			meta: {
				page: query.page,
				pageSize: query.pageSize,
				totalCount,
				totalPages,
			},
		}
	}
}
