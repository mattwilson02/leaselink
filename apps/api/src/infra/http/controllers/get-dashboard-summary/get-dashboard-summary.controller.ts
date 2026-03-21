import { Controller, Get, UseGuards } from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { DashboardSummaryResponseDTO } from '../../DTOs/dashboard/dashboard-summary-response-dto'
import { ActionType } from '@prisma/client'

type ActivityType =
	| 'MAINTENANCE_REQUEST'
	| 'PAYMENT'
	| 'LEASE_ACTIVATION'
	| 'DOCUMENT_UPLOAD'

function mapActionTypeToActivityType(
	actionType: ActionType | null,
): ActivityType {
	if (!actionType) return 'MAINTENANCE_REQUEST'
	if (actionType === 'MAINTENANCE_UPDATE') return 'MAINTENANCE_REQUEST'
	if (
		actionType === 'PAYMENT_RECEIVED' ||
		actionType === 'PAYMENT_OVERDUE' ||
		actionType === 'RENT_REMINDER'
	)
		return 'PAYMENT'
	if (
		actionType === 'LEASE_RENEWAL' ||
		actionType === 'LEASE_EXPIRY' ||
		actionType === 'SIGN_LEASE'
	)
		return 'LEASE_ACTIVATION'
	if (actionType === 'UPLOAD_DOCUMENT' || actionType === 'SIGN_DOCUMENT')
		return 'DOCUMENT_UPLOAD'
	return 'MAINTENANCE_REQUEST'
}

@ApiTags('Dashboard')
@Controller('/dashboard')
export class GetDashboardSummaryController {
	constructor(private prisma: PrismaService) {}

	@Get('summary')
	@UseGuards(EmployeeOnlyGuard)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Get portfolio dashboard summary for authenticated manager',
	})
	@ApiResponse({
		status: 200,
		description: 'Aggregated portfolio metrics',
		type: DashboardSummaryResponseDTO,
	})
	async handle(@CurrentUser() user: HttpUserResponse) {
		const managerId = user.id
		const now = new Date()
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
		const endOfMonth = new Date(
			now.getFullYear(),
			now.getMonth() + 1,
			0,
			23,
			59,
			59,
			999,
		)
		const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
		const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

		const [
			propertyGroups,
			activeTenantsCount,
			invitedTenantsCount,
			activeLeasesCount,
			pendingLeasesCount,
			expiringIn30DaysCount,
			expiringIn60DaysCount,
			maintenanceGroups,
			emergencyOpenCount,
			expectedThisMonthAgg,
			collectedThisMonthAgg,
			overdueAgg,
			pendingPaymentsCount,
			upcomingExpirations,
			recentNotifications,
		] = await Promise.all([
			this.prisma.property.groupBy({
				by: ['status'],
				// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
				_count: { _all: true },
				where: { managerId },
			}),
			this.prisma.client.count({
				where: {
					leases: { some: { property: { managerId } } },
					status: 'ACTIVE',
				},
			}),
			this.prisma.client.count({
				where: {
					leases: { some: { property: { managerId } } },
					status: 'INVITED',
				},
			}),
			this.prisma.lease.count({
				where: { property: { managerId }, status: 'ACTIVE' },
			}),
			this.prisma.lease.count({
				where: { property: { managerId }, status: 'PENDING' },
			}),
			this.prisma.lease.count({
				where: {
					property: { managerId },
					status: 'ACTIVE',
					endDate: { lte: in30Days, gte: now },
				},
			}),
			this.prisma.lease.count({
				where: {
					property: { managerId },
					status: 'ACTIVE',
					endDate: { lte: in60Days, gte: now },
				},
			}),
			this.prisma.maintenanceRequest.groupBy({
				by: ['status'],
				// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
				_count: { _all: true },
				where: { property: { managerId } },
			}),
			this.prisma.maintenanceRequest.count({
				where: {
					property: { managerId },
					status: 'OPEN',
					priority: 'EMERGENCY',
				},
			}),
			this.prisma.payment.aggregate({
				// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
				_sum: { amount: true },
				where: {
					lease: { property: { managerId } },
					dueDate: { gte: startOfMonth, lte: endOfMonth },
				},
			}),
			this.prisma.payment.aggregate({
				// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
				_sum: { amount: true },
				where: {
					lease: { property: { managerId } },
					dueDate: { gte: startOfMonth, lte: endOfMonth },
					status: 'PAID',
				},
			}),
			this.prisma.payment.aggregate({
				// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
				_sum: { amount: true },
				// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
				_count: { _all: true },
				where: {
					lease: { property: { managerId } },
					status: 'OVERDUE',
				},
			}),
			this.prisma.payment.count({
				where: {
					lease: { property: { managerId } },
					status: 'PENDING',
				},
			}),
			this.prisma.lease.findMany({
				where: {
					property: { managerId },
					status: 'ACTIVE',
					endDate: { lte: in60Days, gte: now },
				},
				include: { property: true, tenant: true },
				orderBy: { endDate: 'asc' },
				take: 10,
			}),
			this.prisma.notification.findMany({
				where: { personId: managerId },
				orderBy: { createdAt: 'desc' },
				take: 10,
			}),
		])

		const propertyCountByStatus = Object.fromEntries(
			propertyGroups.map((g) => [g.status, g._count._all]),
		) as Record<string, number>

		const maintenanceCountByStatus = Object.fromEntries(
			maintenanceGroups.map((g) => [g.status, g._count._all]),
		) as Record<string, number>

		return {
			properties: {
				total: Object.values(propertyCountByStatus).reduce(
					(sum, count) => sum + count,
					0,
				),
				vacant: propertyCountByStatus.VACANT ?? 0,
				listed: propertyCountByStatus.LISTED ?? 0,
				occupied: propertyCountByStatus.OCCUPIED ?? 0,
				maintenance: propertyCountByStatus.MAINTENANCE ?? 0,
			},
			tenants: {
				total: activeTenantsCount + invitedTenantsCount,
				active: activeTenantsCount,
				invited: invitedTenantsCount,
			},
			leases: {
				active: activeLeasesCount,
				pending: pendingLeasesCount,
				expiringWithin30Days: expiringIn30DaysCount,
				expiringWithin60Days: expiringIn60DaysCount,
			},
			maintenance: {
				open: maintenanceCountByStatus.OPEN ?? 0,
				inProgress: maintenanceCountByStatus.IN_PROGRESS ?? 0,
				resolved: maintenanceCountByStatus.RESOLVED ?? 0,
				emergencyOpen: emergencyOpenCount,
			},
			payments: {
				expectedThisMonth: expectedThisMonthAgg._sum.amount ?? 0,
				collectedThisMonth: collectedThisMonthAgg._sum.amount ?? 0,
				overdueTotal: overdueAgg._sum.amount ?? 0,
				overdueCount: overdueAgg._count._all,
				pendingCount: pendingPaymentsCount,
			},
			upcomingLeaseExpirations: upcomingExpirations.map((lease) => ({
				id: lease.id,
				propertyAddress: lease.property.address,
				tenantName: lease.tenant.name,
				endDate: lease.endDate.toISOString(),
				daysUntilExpiry: Math.ceil(
					(lease.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
				),
			})),
			recentActivity: recentNotifications.map((n) => ({
				id: n.id,
				type: mapActionTypeToActivityType(n.actionType),
				title: n.title,
				timestamp: n.createdAt.toISOString(),
			})),
		}
	}
}
