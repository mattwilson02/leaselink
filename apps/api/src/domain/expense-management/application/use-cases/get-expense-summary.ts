import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import {
	ExpensesRepository,
	ExpenseSummaryResult,
} from '../repositories/expenses-repository'

export interface GetExpenseSummaryUseCaseRequest {
	managerId: string
	startDate?: Date
	endDate?: Date
}

type GetExpenseSummaryUseCaseResponse = Either<
	never,
	{ summary: ExpenseSummaryResult[] }
>

@Injectable()
export class GetExpenseSummaryUseCase {
	constructor(private expensesRepository: ExpensesRepository) {}

	async execute(
		request: GetExpenseSummaryUseCaseRequest,
	): Promise<GetExpenseSummaryUseCaseResponse> {
		const now = new Date()
		const startDate =
			request.startDate ?? new Date(now.getFullYear(), now.getMonth(), 1)
		const endDate =
			request.endDate ??
			new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

		const summary = await this.expensesRepository.findSummaryByProperty(
			request.managerId,
			startDate,
			endDate,
		)

		return right({ summary })
	}
}
