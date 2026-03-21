import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Expense } from '@/domain/expense-management/enterprise/entities/expense'
import { ExpenseCategory } from '@/domain/expense-management/enterprise/entities/value-objects/expense-category'
import { Prisma, Expense as PrismaExpense } from '@prisma/client'

export class PrismaExpenseMapper {
	static toDomain(raw: PrismaExpense): Expense {
		return Expense.create(
			{
				propertyId: new UniqueEntityId(raw.propertyId),
				managerId: new UniqueEntityId(raw.managerId),
				maintenanceRequestId: raw.maintenanceRequestId
					? new UniqueEntityId(raw.maintenanceRequestId)
					: null,
				category: ExpenseCategory.create(raw.category),
				amount: raw.amount,
				description: raw.description,
				receiptBlobKey: raw.receiptBlobKey,
				expenseDate: raw.expenseDate,
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt,
			},
			new UniqueEntityId(raw.id),
		)
	}

	static toPrisma(expense: Expense): Prisma.ExpenseUncheckedCreateInput {
		return {
			id: expense.id.toString(),
			propertyId: expense.propertyId.toString(),
			managerId: expense.managerId.toString(),
			maintenanceRequestId: expense.maintenanceRequestId?.toString() ?? null,
			category: expense.category as any,
			amount: expense.amount,
			description: expense.description,
			receiptBlobKey: expense.receiptBlobKey,
			expenseDate: expense.expenseDate,
			createdAt: expense.createdAt,
			updatedAt: expense.updatedAt ?? undefined,
		}
	}
}
