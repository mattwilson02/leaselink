import { UseCaseError } from '@/core/errors/use-case-error'
import { EXPENSE_PROPERTY_NOT_FOUND } from '@leaselink/shared'

export class ExpensePropertyNotFoundError
	extends Error
	implements UseCaseError
{
	message = EXPENSE_PROPERTY_NOT_FOUND

	constructor() {
		super(EXPENSE_PROPERTY_NOT_FOUND)
	}
}
