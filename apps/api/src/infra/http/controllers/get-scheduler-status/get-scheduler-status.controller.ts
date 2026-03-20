import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { EnvService } from '@/infra/env/env.service'

@ApiTags('Scheduler')
@Controller('/scheduler')
export class GetSchedulerStatusController {
	constructor(private envService: EnvService) {}

	@Get('status')
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get scheduler status and task configuration' })
	handle() {
		const enabled = this.envService.get('SCHEDULER_ENABLED')

		return {
			enabled,
			tasks: [
				{
					name: 'Payment Generation',
					schedule: 'Daily at 00:05 UTC',
					description: 'Generates monthly payment records for active leases',
				},
				{
					name: 'Overdue Detection',
					schedule: 'Daily at 00:30 UTC',
					description: 'Marks payments as overdue after 5-day grace period',
				},
				{
					name: 'Lease Expiry Warnings',
					schedule: 'Daily at 06:00 UTC',
					description:
						'Sends notifications for leases expiring at 60/30/7 days',
				},
				{
					name: 'Rent Due Reminders',
					schedule: 'Daily at 08:00 UTC',
					description: 'Sends reminders for payments due within 3 days',
				},
			],
		}
	}
}
