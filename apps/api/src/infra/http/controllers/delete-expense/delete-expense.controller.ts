import { DeleteExpenseUseCase } from '@/domain/expense-management/application/use-cases/delete-expense'
import { ExpenseNotFoundError } from '@/domain/expense-management/application/use-cases/errors/expense-not-found-error'
import { CreateAuditLogUseCase } from '@/domain/audit/application/use-cases/create-audit-log'
import {
	Controller,
	Delete,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Optional,
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
import { HttpUserResponse } from '../../presenters/http-user-presenter'

@ApiTags('Expenses')
@Controller('/expenses')
export class DeleteExpenseController {
	constructor(
		private deleteExpense: DeleteExpenseUseCase,
		@Optional() private createAuditLog?: CreateAuditLogUseCase,
	) {}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Delete an expense' })
	@ApiParam({ name: 'id', description: 'Expense UUID' })
	@ApiResponse({
		status: HttpStatus.NO_CONTENT,
		description: 'Expense deleted',
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Expense not found',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') expenseId: string,
	) {
		const response = await this.deleteExpense.execute({
			expenseId,
			managerId: user.id,
		})

		if (response.isLeft()) {
			const error = response.value
			const errorMap = {
				[ExpenseNotFoundError.name]: NotFoundException,
			}
			const exceptionClass =
				errorMap[error.constructor.name] ?? NotFoundException
			throw new exceptionClass(error.message)
		}

		this.createAuditLog
			?.execute({
				actorId: user.id,
				actorType: 'EMPLOYEE',
				action: 'DELETE',
				resourceType: 'EXPENSE',
				resourceId: expenseId,
			})
			.catch((err) => console.error('Audit log failed:', err))
	}
}
