import { GetAuditLogsByResourceUseCase } from '@/domain/audit/application/use-cases/get-audit-logs-by-resource'
import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Query,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { HttpAuditLogPresenter } from '../../presenters/http-audit-log-presenter'

const paginationSchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce.number().int().positive().max(100).default(20),
})
type PaginationQuery = z.infer<typeof paginationSchema>
const queryValidationPipe = new ZodValidationPipe(paginationSchema)

@ApiTags('Audit Logs')
@Controller('/audit-logs')
export class GetAuditLogsByResourceController {
	constructor(private getAuditLogsByResource: GetAuditLogsByResourceUseCase) {}

	@Get(':resourceType/:resourceId')
	@HttpCode(HttpStatus.OK)
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get audit logs for a specific resource' })
	@ApiParam({
		name: 'resourceType',
		description: 'Resource type (e.g. PROPERTY, LEASE)',
	})
	@ApiParam({ name: 'resourceId', description: 'Resource UUID' })
	@ApiQuery({ name: 'page', required: false })
	@ApiQuery({ name: 'pageSize', required: false })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Audit logs for resource',
	})
	async handle(
		@Param('resourceType') resourceType: string,
		@Param('resourceId') resourceId: string,
		@Query(queryValidationPipe) query: PaginationQuery,
	) {
		const response = await this.getAuditLogsByResource.execute({
			resourceType,
			resourceId,
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
