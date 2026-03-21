import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Expense } from '../../enterprise/entities/expense'
import { ExpensesRepository } from '../repositories/expenses-repository'
import { ExpenseNotFoundError } from './errors/expense-not-found-error'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { ExpenseCategoryType } from '../../enterprise/entities/value-objects/expense-category'

export interface UpdateExpenseUseCaseRequest {
	expenseId: string
	managerId: string
	category?: string
	amount?: number
	description?: string
	expenseDate?: Date
	maintenanceRequestId?: string | null
}

type UpdateExpenseUseCaseResponse = Either<
	ExpenseNotFoundError,
	{ expense: Expense }
>

@Injectable()
export class UpdateExpenseUseCase {
	constructor(private expensesRepository: ExpensesRepository) {}

	async execute(
		request: UpdateExpenseUseCaseRequest,
	): Promise<UpdateExpenseUseCaseResponse> {
		const expense = await this.expensesRepository.findById(request.expenseId)

		if (!expense || expense.managerId.toString() !== request.managerId) {
			return left(new ExpenseNotFoundError())
		}

		if (request.category !== undefined) {
			expense.category = request.category as ExpenseCategoryType
		}

		if (request.amount !== undefined) {
			expense.amount = request.amount
		}

		if (request.description !== undefined) {
			expense.description = request.description
		}

		if (request.expenseDate !== undefined) {
			expense.expenseDate = request.expenseDate
		}

		if (request.maintenanceRequestId !== undefined) {
			expense.maintenanceRequestId =
				request.maintenanceRequestId !== null
					? new UniqueEntityId(request.maintenanceRequestId)
					: null
		}

		const updated = await this.expensesRepository.update(expense)

		return right({ expense: updated })
	}
}
