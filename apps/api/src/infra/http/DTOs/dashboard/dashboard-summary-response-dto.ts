import { ApiProperty } from '@nestjs/swagger'

class DashboardPropertiesDTO {
	@ApiProperty({ example: 10 })
	total: number

	@ApiProperty({ example: 3 })
	vacant: number

	@ApiProperty({ example: 2 })
	listed: number

	@ApiProperty({ example: 4 })
	occupied: number

	@ApiProperty({ example: 1 })
	maintenance: number
}

class DashboardTenantsDTO {
	@ApiProperty({ example: 8 })
	total: number

	@ApiProperty({ example: 6 })
	active: number

	@ApiProperty({ example: 2 })
	invited: number
}

class DashboardLeasesDTO {
	@ApiProperty({ example: 5 })
	active: number

	@ApiProperty({ example: 1 })
	pending: number

	@ApiProperty({ example: 2 })
	expiringWithin30Days: number

	@ApiProperty({ example: 3 })
	expiringWithin60Days: number
}

class DashboardMaintenanceDTO {
	@ApiProperty({ example: 4 })
	open: number

	@ApiProperty({ example: 2 })
	inProgress: number

	@ApiProperty({ example: 10 })
	resolved: number

	@ApiProperty({ example: 1 })
	emergencyOpen: number
}

class DashboardPaymentsDTO {
	@ApiProperty({ example: 15000 })
	expectedThisMonth: number

	@ApiProperty({ example: 12000 })
	collectedThisMonth: number

	@ApiProperty({ example: 3000 })
	overdueTotal: number

	@ApiProperty({ example: 2 })
	overdueCount: number

	@ApiProperty({ example: 3 })
	pendingCount: number
}

class DashboardLeaseExpirationDTO {
	@ApiProperty({ example: 'uuid-1234' })
	id: string

	@ApiProperty({ example: '123 Main St' })
	propertyAddress: string

	@ApiProperty({ example: 'John Doe' })
	tenantName: string

	@ApiProperty({ example: '2026-04-15T00:00:00.000Z' })
	endDate: string

	@ApiProperty({ example: 27 })
	daysUntilExpiry: number
}

class DashboardRecentActivityDTO {
	@ApiProperty({ example: 'uuid-5678' })
	id: string

	@ApiProperty({
		example: 'MAINTENANCE_REQUEST',
		enum: [
			'MAINTENANCE_REQUEST',
			'PAYMENT',
			'LEASE_ACTIVATION',
			'DOCUMENT_UPLOAD',
		],
	})
	type: string

	@ApiProperty({ example: 'New maintenance request submitted' })
	title: string

	@ApiProperty({ example: '2026-03-18T10:00:00.000Z' })
	timestamp: string
}

export class DashboardSummaryResponseDTO {
	@ApiProperty({ type: DashboardPropertiesDTO })
	properties: DashboardPropertiesDTO

	@ApiProperty({ type: DashboardTenantsDTO })
	tenants: DashboardTenantsDTO

	@ApiProperty({ type: DashboardLeasesDTO })
	leases: DashboardLeasesDTO

	@ApiProperty({ type: DashboardMaintenanceDTO })
	maintenance: DashboardMaintenanceDTO

	@ApiProperty({ type: DashboardPaymentsDTO })
	payments: DashboardPaymentsDTO

	@ApiProperty({ type: [DashboardLeaseExpirationDTO] })
	upcomingLeaseExpirations: DashboardLeaseExpirationDTO[]

	@ApiProperty({ type: [DashboardRecentActivityDTO] })
	recentActivity: DashboardRecentActivityDTO[]
}
