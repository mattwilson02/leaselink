import type { Expense } from '../../enterprise/entities/expense'

export interface ExpensesFilterParams {
	managerId: string
	propertyId?: string
	category?: string
	dateFrom?: Date
	dateTo?: Date
	page: number
	pageSize: number
}

export interface ExpensesPaginatedResult {
	expenses: Expense[]
	totalCount: number
}

export interface ExpenseSummaryResult {
	propertyId: string
	propertyAddress: string
	totalAmount: number
	count: number
}

export abstract class ExpensesRepository {
	abstract create(expense: Expense): Promise<void>
	abstract findById(expenseId: string): Promise<Expense | null>
	abstract findMany(
		params: ExpensesFilterParams,
	): Promise<ExpensesPaginatedResult>
	abstract findSummaryByProperty(
		managerId: string,
		startDate: Date,
		endDate: Date,
	): Promise<ExpenseSummaryResult[]>
	abstract update(expense: Expense): Promise<Expense>
	abstract delete(expenseId: string): Promise<void>
}
