import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Expense } from '../../enterprise/entities/expense'
import { ExpensesRepository } from '../repositories/expenses-repository'
import { ExpenseNotFoundError } from './errors/expense-not-found-error'

export interface GetExpenseByIdUseCaseRequest {
	expenseId: string
	managerId: string
}

type GetExpenseByIdUseCaseResponse = Either<
	ExpenseNotFoundError,
	{ expense: Expense }
>

@Injectable()
export class GetExpenseByIdUseCase {
	constructor(private expensesRepository: ExpensesRepository) {}

	async execute(
		request: GetExpenseByIdUseCaseRequest,
	): Promise<GetExpenseByIdUseCaseResponse> {
		const expense = await this.expensesRepository.findById(request.expenseId)

		if (!expense || expense.managerId.toString() !== request.managerId) {
			return left(new ExpenseNotFoundError())
		}

		return right({ expense })
	}
}
