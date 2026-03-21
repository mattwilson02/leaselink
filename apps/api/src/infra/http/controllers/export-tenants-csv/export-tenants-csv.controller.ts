import { GetClientsUseCase } from '@/domain/financial-management/application/use-cases/get-clients'
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
import { TenantStatus } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'

const tenantExportQuerySchema = z.object({
	status: z.nativeEnum(TenantStatus).optional(),
	search: z.string().optional(),
})

type TenantExportQuery = z.infer<typeof tenantExportQuerySchema>

const queryValidationPipe = new ZodValidationPipe(tenantExportQuerySchema)

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

@ApiTags('Tenants')
@Controller('/tenants')
export class ExportTenantsCsvController {
	constructor(private getClients: GetClientsUseCase) {}

	@Get('/export')
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Export tenants as CSV (manager only)' })
	@ApiQuery({
		name: 'status',
		required: false,
		enum: ['INVITED', 'ACTIVE', 'INACTIVE'],
	})
	@ApiQuery({ name: 'search', required: false })
	@ApiResponse({ status: 200, description: 'CSV file download' })
	async handle(
		@Query(queryValidationPipe) query: TenantExportQuery,
		@Res() res: Response,
	) {
		const response = await this.getClients.execute({
			status: query.status,
			search: query.search,
			page: 1,
			pageSize: 10000,
		})

		const { clients } = response.value

		const headers = [
			'Name',
			'Email',
			'Phone',
			'Status',
			'Onboarding Status',
			'Created At',
		]

		const rows = clients.map((client) => {
			return [
				escapeCsv(client.name),
				escapeCsv(client.email),
				escapeCsv(client.phoneNumber),
				escapeCsv(client.status),
				escapeCsv(client.onboardingStatus),
				escapeCsv(formatDate(client.createdAt)),
			].join(',')
		})

		const csv = [headers.join(','), ...rows].join('\n')
		const today = formatDate(new Date())

		res.setHeader('Content-Type', 'text/csv')
		res.setHeader(
			'Content-Disposition',
			`attachment; filename="tenants-export-${today}.csv"`,
		)
		res.send(csv)
	}
}
