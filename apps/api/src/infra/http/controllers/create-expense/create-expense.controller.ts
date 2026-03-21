import { CreateExpenseUseCase } from '@/domain/expense-management/application/use-cases/create-expense'
import { ExpensePropertyNotFoundError } from '@/domain/expense-management/application/use-cases/errors/expense-property-not-found-error'
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
import { createExpenseSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpExpensePresenter } from '../../presenters/http-expense-presenter'
import { z } from 'zod'

type CreateExpenseBody = z.infer<typeof createExpenseSchema>
const bodyValidationPipe = new ZodValidationPipe(createExpenseSchema)

@ApiTags('Expenses')
@Controller('/expenses')
export class CreateExpenseController {
	constructor(
		private createExpense: CreateExpenseUseCase,
		@Optional() private createAuditLog?: CreateAuditLogUseCase,
	) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Create a new expense' })
	@ApiBody({
		schema: {
			type: 'object',
			required: [
				'propertyId',
				'category',
				'amount',
				'description',
				'expenseDate',
			],
			properties: {
				propertyId: { type: 'string', format: 'uuid' },
				category: { type: 'string' },
				amount: { type: 'number' },
				description: { type: 'string' },
				expenseDate: { type: 'string', format: 'date-time' },
				maintenanceRequestId: { type: 'string', format: 'uuid' },
			},
		},
	})
	@ApiResponse({ status: HttpStatus.CREATED, description: 'Expense created' })
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Property not found',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Body(bodyValidationPipe) body: CreateExpenseBody,
	) {
		const response = await this.createExpense.execute({
			managerId: user.id,
			propertyId: body.propertyId,
			category: body.category,
			amount: body.amount,
			description: body.description,
			expenseDate: new Date(body.expenseDate),
			maintenanceRequestId: body.maintenanceRequestId,
		})

		if (response.isLeft()) {
			const error = response.value
			const errorMap: Record<string, any> = {
				[ExpensePropertyNotFoundError.name]: NotFoundException,
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
				action: 'CREATE',
				resourceType: 'EXPENSE',
				resourceId: response.value.expense.id.toString(),
				metadata: { amount: body.amount, category: body.category },
			})
			.catch((err) => console.error('Audit log failed:', err))

		return result
	}
}
