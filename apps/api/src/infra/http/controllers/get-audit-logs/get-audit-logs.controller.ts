import { GetAuditLogsUseCase } from '@/domain/audit/application/use-cases/get-audit-logs'
import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Query,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { auditLogFilterSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { HttpAuditLogPresenter } from '../../presenters/http-audit-log-presenter'
import { z } from 'zod'

type AuditLogFilterQuery = z.infer<typeof auditLogFilterSchema>
const queryValidationPipe = new ZodValidationPipe(auditLogFilterSchema)

@ApiTags('Audit Logs')
@Controller('/audit-logs')
export class GetAuditLogsController {
	constructor(private getAuditLogs: GetAuditLogsUseCase) {}

	@Get()
	@HttpCode(HttpStatus.OK)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get audit logs with filters' })
	@ApiQuery({ name: 'resourceType', required: false })
	@ApiQuery({ name: 'resourceId', required: false })
	@ApiQuery({ name: 'action', required: false })
	@ApiQuery({ name: 'actorId', required: false })
	@ApiQuery({ name: 'dateFrom', required: false })
	@ApiQuery({ name: 'dateTo', required: false })
	@ApiQuery({ name: 'page', required: false })
	@ApiQuery({ name: 'pageSize', required: false })
	@ApiResponse({ status: HttpStatus.OK, description: 'Audit logs list' })
	async handle(@Query(queryValidationPipe) query: AuditLogFilterQuery) {
		const response = await this.getAuditLogs.execute({
			resourceType: query.resourceType,
			resourceId: query.resourceId,
			action: query.action,
			actorId: query.actorId,
			dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
			dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
			page: query.page,
			pageSize: query.pageSize,
		})

		const { auditLogs, totalCount } = response.value
		const totalPages = Math.ceil(totalCount / query.pageSize)

		return {
			data: HttpAuditLogPresenter.toHTTPList(auditLogs),
			meta: {
				page: query.page,
				pageSize: query.pageSize,
				totalCount,
				totalPages,
			},
		}
	}
}
