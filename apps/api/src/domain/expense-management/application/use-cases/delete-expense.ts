import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ExpensesRepository } from '../repositories/expenses-repository'
import { ExpenseNotFoundError } from './errors/expense-not-found-error'

export interface DeleteExpenseUseCaseRequest {
	expenseId: string
	managerId: string
}

type DeleteExpenseUseCaseResponse = Either<ExpenseNotFoundError, object>

@Injectable()
export class DeleteExpenseUseCase {
	constructor(private expensesRepository: ExpensesRepository) {}

	async execute(
		request: DeleteExpenseUseCaseRequest,
	): Promise<DeleteExpenseUseCaseResponse> {
		const expense = await this.expensesRepository.findById(request.expenseId)

		if (!expense || expense.managerId.toString() !== request.managerId) {
			return left(new ExpenseNotFoundError())
		}

		await this.expensesRepository.delete(request.expenseId)

		return right({})
	}
}
