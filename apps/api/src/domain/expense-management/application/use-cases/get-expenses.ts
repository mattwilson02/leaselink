import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Expense } from '../../enterprise/entities/expense'
import {
	ExpensesRepository,
	ExpensesFilterParams,
} from '../repositories/expenses-repository'

export interface GetExpensesUseCaseRequest {
	managerId: string
	propertyId?: string
	category?: string
	dateFrom?: Date
	dateTo?: Date
	page: number
	pageSize: number
}

type GetExpensesUseCaseResponse = Either<
	never,
	{ expenses: Expense[]; totalCount: number }
>

@Injectable()
export class GetExpensesUseCase {
	constructor(private expensesRepository: ExpensesRepository) {}

	async execute(
		request: GetExpensesUseCaseRequest,
	): Promise<GetExpensesUseCaseResponse> {
		const params: ExpensesFilterParams = {
			managerId: request.managerId,
			propertyId: request.propertyId,
			category: request.category,
			dateFrom: request.dateFrom,
			dateTo: request.dateTo,
			page: request.page,
			pageSize: request.pageSize,
		}

		const { expenses, totalCount } =
			await this.expensesRepository.findMany(params)

		return right({ expenses, totalCount })
	}
}
