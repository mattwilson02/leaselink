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
import { PaymentStatus } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import type { Prisma } from '@prisma/client'
import type { PAYMENT_STATUS } from '@prisma/client'

const paymentExportQuerySchema = z.object({
	status: z.nativeEnum(PaymentStatus).optional(),
	propertyId: z.string().uuid().optional(),
	tenantId: z.string().uuid().optional(),
})

type PaymentExportQuery = z.infer<typeof paymentExportQuerySchema>

const queryValidationPipe = new ZodValidationPipe(paymentExportQuerySchema)

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

@ApiTags('Payments')
@Controller('/payments')
export class ExportPaymentsCsvController {
	constructor(private prisma: PrismaService) {}

	@Get('/export')
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Export payments as CSV (manager only)' })
	@ApiQuery({ name: 'status', required: false })
	@ApiQuery({ name: 'propertyId', required: false })
	@ApiQuery({ name: 'tenantId', required: false })
	@ApiResponse({ status: 200, description: 'CSV file download' })
	async handle(
		@Query(queryValidationPipe) query: PaymentExportQuery,
		@Res() res: Response,
	) {
		const where: Prisma.PaymentWhereInput = {}

		if (query.status) where.status = query.status as PAYMENT_STATUS
		if (query.tenantId) where.tenantId = query.tenantId
		if (query.propertyId) {
			where.lease = { propertyId: query.propertyId }
		}

		const payments = await this.prisma.payment.findMany({
			where,
			orderBy: { dueDate: 'desc' },
			include: {
				tenant: true,
				lease: {
					include: {
						property: true,
					},
				},
			},
		})

		const headers = [
			'Tenant Name',
			'Property Address',
			'Amount',
			'Due Date',
			'Status',
			'Paid At',
		]

		const rows = payments.map((payment) => {
			const tenantName = payment.tenant?.name ?? ''
			const propertyAddress = payment.lease?.property?.address ?? ''
			return [
				escapeCsv(tenantName),
				escapeCsv(propertyAddress),
				escapeCsv(payment.amount),
				escapeCsv(formatDate(payment.dueDate)),
				escapeCsv(payment.status),
				escapeCsv(formatDate(payment.paidAt)),
			].join(',')
		})

		const csv = [headers.join(','), ...rows].join('\n')
		const today = formatDate(new Date())

		res.setHeader('Content-Type', 'text/csv')
		res.setHeader(
			'Content-Disposition',
			`attachment; filename="payments-export-${today}.csv"`,
		)
		res.send(csv)
	}
}
