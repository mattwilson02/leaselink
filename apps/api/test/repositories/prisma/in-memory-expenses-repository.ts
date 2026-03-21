import type {
	ExpensesRepository,
	ExpensesFilterParams,
	ExpensesPaginatedResult,
	ExpenseSummaryResult,
} from '@/domain/expense-management/application/repositories/expenses-repository'
import type { Expense } from '@/domain/expense-management/enterprise/entities/expense'

export class InMemoryExpensesRepository implements ExpensesRepository {
	public items: Expense[] = []
	// propertyId -> address lookup for summary tests
	public propertyAddresses: Map<string, string> = new Map()

	async create(expense: Expense): Promise<void> {
		this.items.push(expense)
	}

	async findById(expenseId: string): Promise<Expense | null> {
		return this.items.find((e) => e.id.toString() === expenseId) ?? null
	}

	async findMany(
		params: ExpensesFilterParams,
	): Promise<ExpensesPaginatedResult> {
		let filtered = this.items.filter(
			(e) => e.managerId.toString() === params.managerId,
		)

		if (params.propertyId) {
			filtered = filtered.filter(
				(e) => e.propertyId.toString() === params.propertyId,
			)
		}

		if (params.category) {
			filtered = filtered.filter((e) => e.category === params.category)
		}

		if (params.dateFrom) {
			filtered = filtered.filter((e) => e.expenseDate >= params.dateFrom!)
		}

		if (params.dateTo) {
			filtered = filtered.filter((e) => e.expenseDate <= params.dateTo!)
		}

		const totalCount = filtered.length
		const start = (params.page - 1) * params.pageSize
		const paginated = filtered.slice(start, start + params.pageSize)

		return { expenses: paginated, totalCount }
	}

	async findSummaryByProperty(
		managerId: string,
		startDate: Date,
		endDate: Date,
	): Promise<ExpenseSummaryResult[]> {
		const filtered = this.items.filter(
			(e) =>
				e.managerId.toString() === managerId &&
				e.expenseDate >= startDate &&
				e.expenseDate <= endDate,
		)

		const summaryMap = new Map<string, { totalAmount: number; count: number }>()

		for (const expense of filtered) {
			const propertyId = expense.propertyId.toString()
			const existing = summaryMap.get(propertyId) ?? {
				totalAmount: 0,
				count: 0,
			}
			summaryMap.set(propertyId, {
				totalAmount: existing.totalAmount + expense.amount,
				count: existing.count + 1,
			})
		}

		return Array.from(summaryMap.entries()).map(([propertyId, data]) => ({
			propertyId,
			propertyAddress: this.propertyAddresses.get(propertyId) ?? '',
			totalAmount: data.totalAmount,
			count: data.count,
		}))
	}

	async update(expense: Expense): Promise<Expense> {
		const index = this.items.findIndex(
			(e) => e.id.toString() === expense.id.toString(),
		)
		if (index !== -1) {
			this.items[index] = expense
		}
		return expense
	}

	async delete(expenseId: string): Promise<void> {
		this.items = this.items.filter((e) => e.id.toString() !== expenseId)
	}
}
