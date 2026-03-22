import { ConfirmExpenseReceiptUseCase } from '@/domain/expense-management/application/use-cases/confirm-expense-receipt'
import { ExpenseNotFoundError } from '@/domain/expense-management/application/use-cases/errors/expense-not-found-error'
import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
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
import { z } from 'zod'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpExpensePresenter } from '../../presenters/http-expense-presenter'

const confirmReceiptSchema = z.object({
	blobKey: z.string().min(1),
})
type ConfirmReceiptBody = z.infer<typeof confirmReceiptSchema>
const bodyValidationPipe = new ZodValidationPipe(confirmReceiptSchema)

@ApiTags('Expenses')
@Controller('/expenses')
export class ConfirmExpenseReceiptController {
	constructor(private confirmExpenseReceipt: ConfirmExpenseReceiptUseCase) {}

	@Post(':id/receipt/confirm')
	@HttpCode(HttpStatus.OK)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Confirm expense receipt upload' })
	@ApiParam({ name: 'id', description: 'Expense UUID' })
	@ApiBody({
		schema: {
			type: 'object',
			required: ['blobKey'],
			properties: {
				blobKey: { type: 'string' },
			},
		},
	})
	@ApiResponse({ status: HttpStatus.OK, description: 'Receipt confirmed' })
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Expense not found',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') expenseId: string,
		@Body(bodyValidationPipe) body: ConfirmReceiptBody,
	) {
		const response = await this.confirmExpenseReceipt.execute({
			expenseId,
			managerId: user.id,
			blobKey: body.blobKey,
		})

		if (response.isLeft()) {
			const error = response.value
			const errorMap = {
				[ExpenseNotFoundError.name]: NotFoundException,
			}
			const exceptionClass =
				errorMap[error.constructor.name] ?? BadRequestException
			throw new exceptionClass(error.message)
		}

		return { expense: HttpExpensePresenter.toHTTP(response.value.expense) }
	}
}
