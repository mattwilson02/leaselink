import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import {
	ExpenseCategory,
	ExpenseCategoryType,
} from './value-objects/expense-category'

export interface ExpenseProps {
	propertyId: UniqueEntityId
	managerId: UniqueEntityId
	maintenanceRequestId: UniqueEntityId | null
	category: ExpenseCategory
	amount: number
	description: string
	receiptBlobKey: string | null
	expenseDate: Date
	createdAt: Date
	updatedAt?: Date | null
}

export class Expense extends Entity<ExpenseProps> {
	get propertyId() {
		return this.props.propertyId
	}

	get managerId() {
		return this.props.managerId
	}

	get maintenanceRequestId() {
		return this.props.maintenanceRequestId
	}
	set maintenanceRequestId(value: UniqueEntityId | null) {
		this.props.maintenanceRequestId = value
		this.touch()
	}

	get category(): ExpenseCategoryType {
		return this.props.category.value
	}
	set category(value: ExpenseCategoryType) {
		this.props.category = ExpenseCategory.create(value)
		this.touch()
	}

	get amount() {
		return this.props.amount
	}
	set amount(value: number) {
		this.props.amount = value
		this.touch()
	}

	get description() {
		return this.props.description
	}
	set description(value: string) {
		this.props.description = value
		this.touch()
	}

	get receiptBlobKey() {
		return this.props.receiptBlobKey
	}
	set receiptBlobKey(value: string | null) {
		this.props.receiptBlobKey = value
		this.touch()
	}

	get expenseDate() {
		return this.props.expenseDate
	}
	set expenseDate(value: Date) {
		this.props.expenseDate = value
		this.touch()
	}

	get createdAt() {
		return this.props.createdAt
	}

	get updatedAt() {
		return this.props.updatedAt
	}

	private touch() {
		this.props.updatedAt = new Date()
	}

	static create(
		props: Optional<ExpenseProps, 'createdAt' | 'receiptBlobKey'>,
		id?: UniqueEntityId,
	) {
		const expense = new Expense(
			{
				...props,
				category:
					props.category instanceof ExpenseCategory
						? props.category
						: ExpenseCategory.create(props.category as unknown as string),
				receiptBlobKey: props.receiptBlobKey ?? null,
				createdAt: props.createdAt ?? new Date(),
			},
			id,
		)
		return expense
	}
}
