import { Expense } from '@/domain/expense-management/enterprise/entities/expense'

export interface ExpenseHttpResponse {
	id: string
	propertyId: string
	managerId: string
	maintenanceRequestId: string | null
	category: string
	amount: number
	description: string
	receiptBlobKey: string | null
	expenseDate: string
	createdAt: string
	updatedAt: string | null
}

export class HttpExpensePresenter {
	static toHTTP(expense: Expense): ExpenseHttpResponse {
		return {
			id: expense.id.toString(),
			propertyId: expense.propertyId.toString(),
			managerId: expense.managerId.toString(),
			maintenanceRequestId: expense.maintenanceRequestId?.toString() ?? null,
			category: expense.category,
			amount: expense.amount,
			description: expense.description,
			receiptBlobKey: expense.receiptBlobKey,
			expenseDate:
				expense.expenseDate instanceof Date
					? expense.expenseDate.toISOString()
					: expense.expenseDate,
			createdAt:
				expense.createdAt instanceof Date
					? expense.createdAt.toISOString()
					: expense.createdAt,
			updatedAt: expense.updatedAt
				? expense.updatedAt instanceof Date
					? expense.updatedAt.toISOString()
					: expense.updatedAt
				: null,
		}
	}

	static toHTTPList(expenses: Expense[]): ExpenseHttpResponse[] {
		return expenses.map(HttpExpensePresenter.toHTTP)
	}
}
