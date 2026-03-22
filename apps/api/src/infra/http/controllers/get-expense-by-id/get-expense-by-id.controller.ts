import { GetExpenseByIdUseCase } from '@/domain/expense-management/application/use-cases/get-expense-by-id'
import { ExpenseNotFoundError } from '@/domain/expense-management/application/use-cases/errors/expense-not-found-error'
import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
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
import type { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpExpensePresenter } from '../../presenters/http-expense-presenter'
import { StorageRepository } from '@/domain/document/application/repositories/storage-repository'

@ApiTags('Expenses')
@Controller('/expenses')
export class GetExpenseByIdController {
	constructor(
		private getExpenseById: GetExpenseByIdUseCase,
		private storageRepository: StorageRepository,
	) {}

	@Get(':id')
	@HttpCode(HttpStatus.OK)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get expense by ID' })
	@ApiParam({ name: 'id', description: 'Expense UUID' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Expense found' })
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Expense not found',
	})
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Param('id') expenseId: string,
	) {
		const response = await this.getExpenseById.execute({
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

		const expenseData = HttpExpensePresenter.toHTTP(response.value.expense)

		if (expenseData.receiptBlobKey) {
			const urlResult = await this.storageRepository.generateDownloadUrl({
				blobName: expenseData.receiptBlobKey,
			})
			if (urlResult.isRight()) {
				return {
					data: { ...expenseData, receiptUrl: urlResult.value.downloadUrl },
				}
			}
		}

		return { data: expenseData }
	}
}
