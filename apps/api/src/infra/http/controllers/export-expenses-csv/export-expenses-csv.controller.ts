import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { Response } from 'express'
import { z } from 'zod'
import { ZodValidationPipe } from 'nestjs-zod'
import { ExpenseCategory, EXPENSE_CATEGORY_LABELS } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import type { Prisma } from '@prisma/client'

const expenseExportQuerySchema = z.object({
	propertyId: z.string().uuid().optional(),
	category: z.nativeEnum(ExpenseCategory).optional(),
	dateFrom: z.string().datetime().optional(),
	dateTo: z.string().datetime().optional(),
})

type ExpenseExportQuery = z.infer<typeof expenseExportQuerySchema>

const queryValidationPipe = new ZodValidationPipe(expenseExportQuerySchema)

function escapeCsv(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return ''
	const str = String(value)
	if (str.includes(',') || str.includes('"') || str.includes('\n')) {
		return `"${str.replace(/"/g, '""')}"`
	}
	return str
}

function formatDate(date: Date | null | undefined): string {
	if (!date) return ''
	const d = date instanceof Date ? date : new Date(date)
	return d.toISOString().split('T')[0]
}

@ApiTags('Expenses')
@Controller('/expenses')
export class ExportExpensesCsvController {
	constructor(private prisma: PrismaService) {}

	@Get('/export')
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Export expenses as CSV (manager only)' })
	@ApiQuery({ name: 'propertyId', required: false })
	@ApiQuery({ name: 'category', required: false })
	@ApiQuery({ name: 'dateFrom', required: false })
	@ApiQuery({ name: 'dateTo', required: false })
	@ApiResponse({ status: 200, description: 'CSV file download' })
	async handle(
		@CurrentUser() user: HttpUserResponse,
		@Query(queryValidationPipe) query: ExpenseExportQuery,
		@Res() res: Response,
	) {
		const where: Prisma.ExpenseWhereInput = {
			managerId: user.id,
		}

		if (query.propertyId) where.propertyId = query.propertyId
		if (query.category) where.category = query.category as any

		if (query.dateFrom || query.dateTo) {
			where.expenseDate = {}
			if (query.dateFrom) where.expenseDate.gte = new Date(query.dateFrom)
			if (query.dateTo) where.expenseDate.lte = new Date(query.dateTo)
		}

		const expenses = await this.prisma.expense.findMany({
			where,
			orderBy: { expenseDate: 'desc' },
			include: {
				property: true,
				maintenanceRequest: {
					include: { vendor: true },
				},
			},
		})

		const headers = [
			'Date',
			'Property Address',
			'Category',
			'Amount',
			'Description',
			'Vendor',
		]

		const rows = expenses.map((expense) => {
			const propertyAddress = expense.property?.address ?? ''
			const categoryLabel =
				EXPENSE_CATEGORY_LABELS[expense.category as ExpenseCategory] ??
				expense.category
			return [
				escapeCsv(formatDate(expense.expenseDate)),
				escapeCsv(propertyAddress),
				escapeCsv(categoryLabel),
				escapeCsv(expense.amount),
				escapeCsv(expense.description),
				escapeCsv(expense.maintenanceRequest?.vendor?.name ?? ''),
			].join(',')
		})

		const csv = [headers.join(','), ...rows].join('\n')
		const today = formatDate(new Date())

		res.setHeader('Content-Type', 'text/csv')
		res.setHeader(
			'Content-Disposition',
			`attachment; filename="expenses-export-${today}.csv"`,
		)
		res.send(csv)
	}
}
