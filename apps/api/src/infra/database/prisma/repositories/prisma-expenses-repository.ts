import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaExpenseMapper } from '../mappers/prisma-expense-mapper'
import type {
	ExpensesRepository,
	ExpensesFilterParams,
	ExpensesPaginatedResult,
	ExpenseSummaryResult,
} from '@/domain/expense-management/application/repositories/expenses-repository'
import type { Expense } from '@/domain/expense-management/enterprise/entities/expense'
import { Prisma, EXPENSE_CATEGORY } from '@prisma/client'

@Injectable()
export class PrismaExpensesRepository implements ExpensesRepository {
	constructor(private prisma: PrismaService) {}

	async create(expense: Expense): Promise<void> {
		const data = PrismaExpenseMapper.toPrisma(expense)
		await this.prisma.expense.create({ data })
	}

	async findById(expenseId: string): Promise<Expense | null> {
		const expense = await this.prisma.expense.findUnique({
			where: { id: expenseId },
		})
		if (!expense) return null
		return PrismaExpenseMapper.toDomain(expense)
	}

	async findMany(
		params: ExpensesFilterParams,
	): Promise<ExpensesPaginatedResult> {
		const where: Prisma.ExpenseWhereInput = {
			managerId: params.managerId,
		}

		if (params.propertyId) {
			where.propertyId = params.propertyId
		}

		if (params.category) {
			where.category = params.category as EXPENSE_CATEGORY
		}

		if (params.dateFrom || params.dateTo) {
			where.expenseDate = {}
			if (params.dateFrom) {
				where.expenseDate.gte = params.dateFrom
			}
			if (params.dateTo) {
				where.expenseDate.lte = params.dateTo
			}
		}

		const [expenses, totalCount] = await Promise.all([
			this.prisma.expense.findMany({
				where,
				orderBy: { expenseDate: 'desc' },
				skip: (params.page - 1) * params.pageSize,
				take: params.pageSize,
			}),
			this.prisma.expense.count({ where }),
		])

		return {
			expenses: expenses.map(PrismaExpenseMapper.toDomain),
			totalCount,
		}
	}

	async findSummaryByProperty(
		managerId: string,
		startDate: Date,
		endDate: Date,
	): Promise<ExpenseSummaryResult[]> {
		const grouped = await this.prisma.expense.groupBy({
			by: ['propertyId'],
			where: {
				managerId,
				expenseDate: {
					gte: startDate,
					lte: endDate,
				},
			},
			// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
			_sum: {
				amount: true,
			},
			// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
			_count: {
				id: true,
			},
		})

		if (grouped.length === 0) return []

		const propertyIds = grouped.map((g) => g.propertyId)
		const properties = await this.prisma.property.findMany({
			where: { id: { in: propertyIds } },
			select: { id: true, address: true },
		})

		const propertyMap = new Map(properties.map((p) => [p.id, p.address]))

		return grouped.map((g) => ({
			propertyId: g.propertyId,
			propertyAddress: propertyMap.get(g.propertyId) ?? '',
			totalAmount: g._sum.amount ?? 0,
			count: g._count.id,
		}))
	}

	async update(expense: Expense): Promise<Expense> {
		const data = PrismaExpenseMapper.toPrisma(expense)
		const updated = await this.prisma.expense.update({
			where: { id: expense.id.toString() },
			data,
		})
		return PrismaExpenseMapper.toDomain(updated)
	}

	async delete(expenseId: string): Promise<void> {
		await this.prisma.expense.delete({
			where: { id: expenseId },
		})
	}
}
