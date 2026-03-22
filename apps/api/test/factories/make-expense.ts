import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
	Expense,
	ExpenseProps,
} from '@/domain/expense-management/enterprise/entities/expense'
import { ExpenseCategory } from '@/domain/expense-management/enterprise/entities/value-objects/expense-category'
import { faker } from '@faker-js/faker'

export const makeExpense = (
	override: Partial<ExpenseProps> = {},
	id?: UniqueEntityId,
) => {
	return Expense.create(
		{
			propertyId: new UniqueEntityId(),
			managerId: new UniqueEntityId(),
			maintenanceRequestId: null,
			category: ExpenseCategory.create('MAINTENANCE'),
			amount: faker.number.float({ min: 50, max: 5000, multipleOf: 0.01 }),
			description: faker.lorem.sentence(),
			expenseDate: faker.date.recent({ days: 30 }),
			...override,
		},
		id,
	)
}
