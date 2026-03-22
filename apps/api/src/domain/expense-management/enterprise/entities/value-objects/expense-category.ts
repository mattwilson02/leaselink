import { ValueObject } from '@/core/entities/value-object'

export type ExpenseCategoryType =
	| 'MAINTENANCE'
	| 'INSURANCE'
	| 'TAX'
	| 'UTILITY'
	| 'MANAGEMENT_FEE'
	| 'REPAIR'
	| 'IMPROVEMENT'
	| 'OTHER'

interface ExpenseCategoryProps {
	value: ExpenseCategoryType
}

export class ExpenseCategory extends ValueObject<ExpenseCategoryProps> {
	// biome-ignore lint/style/useNamingConvention: CONSTANT_CASE for static readonly collection
	private static ALLOWED_CATEGORIES: ExpenseCategoryType[] = [
		'MAINTENANCE',
		'INSURANCE',
		'TAX',
		'UTILITY',
		'MANAGEMENT_FEE',
		'REPAIR',
		'IMPROVEMENT',
		'OTHER',
	]

	private constructor(props: ExpenseCategoryProps) {
		super(props)
	}

	static create(category: string): ExpenseCategory {
		if (
			!ExpenseCategory.ALLOWED_CATEGORIES.includes(
				category as ExpenseCategoryType,
			)
		) {
			throw new Error(`Invalid expense category: ${category}`)
		}
		return new ExpenseCategory({ value: category as ExpenseCategoryType })
	}

	get value(): ExpenseCategoryType {
		return this.props.value
	}

	static values(): ExpenseCategoryType[] {
		return ExpenseCategory.ALLOWED_CATEGORIES
	}
}
