import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Expense } from '../../enterprise/entities/expense'
import { ExpensesRepository } from '../repositories/expenses-repository'
import { ExpenseNotFoundError } from './errors/expense-not-found-error'

export interface ConfirmExpenseReceiptUseCaseRequest {
	expenseId: string
	managerId: string
	blobKey: string
}

type ConfirmExpenseReceiptUseCaseResponse = Either<
	ExpenseNotFoundError,
	{ expense: Expense }
>

@Injectable()
export class ConfirmExpenseReceiptUseCase {
	constructor(private expensesRepository: ExpensesRepository) {}

	async execute(
		request: ConfirmExpenseReceiptUseCaseRequest,
	): Promise<ConfirmExpenseReceiptUseCaseResponse> {
		const expense = await this.expensesRepository.findById(request.expenseId)

		if (!expense || expense.managerId.toString() !== request.managerId) {
			return left(new ExpenseNotFoundError())
		}

		expense.receiptBlobKey = request.blobKey

		const updated = await this.expensesRepository.update(expense)

		return right({ expense: updated })
	}
}
