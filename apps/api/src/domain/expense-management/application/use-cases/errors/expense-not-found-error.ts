import { UseCaseError } from '@/core/errors/use-case-error'
import { EXPENSE_NOT_FOUND } from '@leaselink/shared'

export class ExpenseNotFoundError extends Error implements UseCaseError {
	message = EXPENSE_NOT_FOUND

	constructor() {
		super(EXPENSE_NOT_FOUND)
	}
}
