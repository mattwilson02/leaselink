import { UpdateExpenseUseCase } from '@/domain/expense-management/application/use-cases/update-expense'
import { ExpenseNotFoundError } from '@/domain/expense-management/application/use-cases/errors/expense-not-found-error'
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
import { updateExpenseSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpExpensePresenter } from '../../presenters/http-expense-presenter'
import { z } from 'zod'

type UpdateExpenseBody = z.infer<typeof updateExpenseSchema>
const bodyValidationPipe = new ZodValidationPipe(updateExpenseSchema)

@ApiTags('Expenses')
@Controller('/expenses')
export class UpdateExpenseController {
	constructor(
		private updateExpense: UpdateExpenseUseCase,
		@Optional() private createAuditLog?: CreateAuditLogUseCase,
	) {}

	@Put(':id')
	@HttpCode(HttpStatus.OK)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Update an expense' })
	@ApiParam({ name: 'id', description: 'Expense UUID' })
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				category: { type: 'string' },
				amount: { type: 'number' },
				description: { type: 'string' },
				expenseDate: { type: 'string', format: 'date-time' },
				maintenanceRequestId: {
					type: 'string',
					format: 'uuid',
					nullable: true,
				},
			},
		},
	})
	@ApiResponse({ status: HttpStatus.OK, description: 'Expense updated' })
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Expense not found',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') expenseId: string,
		@Body(bodyValidationPipe) body: UpdateExpenseBody,
	) {
		const response = await this.updateExpense.execute({
			expenseId,
			managerId: user.id,
			category: body.category,
			amount: body.amount,
			description: body.description,
			expenseDate: body.expenseDate ? new Date(body.expenseDate) : undefined,
			maintenanceRequestId: body.maintenanceRequestId,
		})

		if (response.isLeft()) {
			const error = response.value
			const errorMap: Record<string, any> = {
				[ExpenseNotFoundError.name]: NotFoundException,
			}
			const ExceptionClass =
				errorMap[error.constructor.name] ?? BadRequestException
			throw new ExceptionClass(error.message)
		}

		const result = {
			expense: HttpExpensePresenter.toHTTP(response.value.expense),
		}

		this.createAuditLog
			?.execute({
				actorId: user.id,
				actorType: 'EMPLOYEE',
				action: 'UPDATE',
				resourceType: 'EXPENSE',
				resourceId: expenseId,
				metadata: { ...body },
			})
			.catch((err) => console.error('Audit log failed:', err))

		return result
	}
}
