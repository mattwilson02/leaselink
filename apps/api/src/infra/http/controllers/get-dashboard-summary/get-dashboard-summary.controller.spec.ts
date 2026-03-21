import { GetDashboardSummaryController } from './get-dashboard-summary.controller'
import type { PrismaService } from '@/infra/database/prisma/prisma.service'
import type { HttpUserResponse } from '../../presenters/http-user-presenter'

function makeUser(id = 'manager-1'): HttpUserResponse {
	return {
		id,
		email: 'manager@test.com',
		name: 'Test Manager',
		type: 'EMPLOYEE',
	} as HttpUserResponse
}

function makePrisma(
	overrides: Partial<ReturnType<typeof buildDefaultPrisma>> = {},
) {
	return { ...buildDefaultPrisma(), ...overrides }
}

function buildDefaultPrisma() {
	return {
		property: {
			groupBy: vi.fn().mockResolvedValue([]),
		},
		client: {
			count: vi.fn().mockResolvedValue(0),
		},
		lease: {
			count: vi.fn().mockResolvedValue(0),
			findMany: vi.fn().mockResolvedValue([]),
		},
		maintenanceRequest: {
			groupBy: vi.fn().mockResolvedValue([]),
			count: vi.fn().mockResolvedValue(0),
		},
		payment: {
			aggregate: vi.fn().mockResolvedValue({
				// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
				_sum: { amount: null },
				// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
				_count: {
					// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
					_all: 0,
				},
			}),
			count: vi.fn().mockResolvedValue(0),
		},
		notification: {
			findMany: vi.fn().mockResolvedValue([]),
		},
	}
}

describe('GetDashboardSummaryController', () => {
	it('returns all zeros for a manager with no portfolio data', async () => {
		const prisma = makePrisma()
		const controller = new GetDashboardSummaryController(
			prisma as unknown as PrismaService,
		)

		const result = await controller.handle(makeUser())

		expect(result.properties.total).toBe(0)
		expect(result.properties.vacant).toBe(0)
		expect(result.tenants.total).toBe(0)
		expect(result.leases.active).toBe(0)
		expect(result.maintenance.open).toBe(0)
		expect(result.payments.expectedThisMonth).toBe(0)
		expect(result.payments.overdueTotal).toBe(0)
		expect(result.upcomingLeaseExpirations).toHaveLength(0)
		expect(result.recentActivity).toHaveLength(0)
	})

	it('correctly aggregates property counts by status', async () => {
		const prisma = makePrisma({
			property: {
				groupBy: vi.fn().mockResolvedValue([
					{
						status: 'VACANT',
						// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
						_count: {
							// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
							_all: 2,
						},
					},
					{
						status: 'OCCUPIED',
						// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
						_count: {
							// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
							_all: 1,
						},
					},
				]),
			},
		})
		const controller = new GetDashboardSummaryController(
			prisma as unknown as PrismaService,
		)

		const result = await controller.handle(makeUser())

		expect(result.properties.total).toBe(3)
		expect(result.properties.vacant).toBe(2)
		expect(result.properties.occupied).toBe(1)
		expect(result.properties.listed).toBe(0)
		expect(result.properties.maintenance).toBe(0)
	})

	it('correctly sums tenant counts', async () => {
		const prisma = makePrisma({
			client: {
				count: vi
					.fn()
					.mockResolvedValueOnce(5) // active
					.mockResolvedValueOnce(2), // invited
			},
		})
		const controller = new GetDashboardSummaryController(
			prisma as unknown as PrismaService,
		)

		const result = await controller.handle(makeUser())

		expect(result.tenants.active).toBe(5)
		expect(result.tenants.invited).toBe(2)
		expect(result.tenants.total).toBe(7)
	})

	it('calculates lease counts and expiration windows', async () => {
		const prisma = makePrisma({
			lease: {
				count: vi
					.fn()
					.mockResolvedValueOnce(4) // active
					.mockResolvedValueOnce(1) // pending
					.mockResolvedValueOnce(1) // expiring in 30 days
					.mockResolvedValueOnce(2), // expiring in 60 days
				findMany: vi.fn().mockResolvedValue([]),
			},
		})
		const controller = new GetDashboardSummaryController(
			prisma as unknown as PrismaService,
		)

		const result = await controller.handle(makeUser())

		expect(result.leases.active).toBe(4)
		expect(result.leases.pending).toBe(1)
		expect(result.leases.expiringWithin30Days).toBe(1)
		expect(result.leases.expiringWithin60Days).toBe(2)
	})

	it('aggregates maintenance counts by status and emergency count', async () => {
		const prisma = makePrisma({
			maintenanceRequest: {
				groupBy: vi.fn().mockResolvedValue([
					{
						status: 'OPEN',
						// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
						_count: {
							// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
							_all: 3,
						},
					},
					{
						status: 'IN_PROGRESS',
						// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
						_count: {
							// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
							_all: 2,
						},
					},
					{
						status: 'RESOLVED',
						// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
						_count: {
							// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
							_all: 8,
						},
					},
				]),
				count: vi.fn().mockResolvedValue(1), // emergency open
			},
		})
		const controller = new GetDashboardSummaryController(
			prisma as unknown as PrismaService,
		)

		const result = await controller.handle(makeUser())

		expect(result.maintenance.open).toBe(3)
		expect(result.maintenance.inProgress).toBe(2)
		expect(result.maintenance.resolved).toBe(8)
		expect(result.maintenance.emergencyOpen).toBe(1)
	})

	it('calculates payment revenue sums for current month', async () => {
		const prisma = makePrisma({
			payment: {
				aggregate: vi
					.fn()
					.mockResolvedValueOnce({
						// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
						_sum: { amount: 3500 },
						// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
						_count: { _all: 0 },
					}) // expected
					.mockResolvedValueOnce({
						// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
						_sum: { amount: 2000 },
						// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
						_count: { _all: 0 },
					}) // collected
					.mockResolvedValueOnce({
						// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
						_sum: { amount: 1500 },
						// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
						_count: { _all: 2 },
					}), // overdue
				count: vi.fn().mockResolvedValue(3), // pending
			},
		})
		const controller = new GetDashboardSummaryController(
			prisma as unknown as PrismaService,
		)

		const result = await controller.handle(makeUser())

		expect(result.payments.expectedThisMonth).toBe(3500)
		expect(result.payments.collectedThisMonth).toBe(2000)
		expect(result.payments.overdueTotal).toBe(1500)
		expect(result.payments.overdueCount).toBe(2)
		expect(result.payments.pendingCount).toBe(3)
	})

	it('returns null payment sums as 0', async () => {
		const prisma = makePrisma({
			payment: {
				aggregate: vi.fn().mockResolvedValue({
					// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
					_sum: { amount: null },
					// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
					_count: {
						// biome-ignore lint/style/useNamingConvention: Prisma aggregation field
						_all: 0,
					},
				}),
				count: vi.fn().mockResolvedValue(0),
			},
		})
		const controller = new GetDashboardSummaryController(
			prisma as unknown as PrismaService,
		)

		const result = await controller.handle(makeUser())

		expect(result.payments.expectedThisMonth).toBe(0)
		expect(result.payments.collectedThisMonth).toBe(0)
		expect(result.payments.overdueTotal).toBe(0)
	})

	it('maps upcoming lease expirations with daysUntilExpiry', async () => {
		const futureDate = new Date()
		futureDate.setDate(futureDate.getDate() + 15)

		const prisma = makePrisma({
			lease: {
				count: vi.fn().mockResolvedValue(0),
				findMany: vi.fn().mockResolvedValue([
					{
						id: 'lease-1',
						endDate: futureDate,
						property: { address: '10 Main St' },
						tenant: { name: 'Alice Smith' },
					},
				]),
			},
		})
		const controller = new GetDashboardSummaryController(
			prisma as unknown as PrismaService,
		)

		const result = await controller.handle(makeUser())

		expect(result.upcomingLeaseExpirations).toHaveLength(1)
		expect(result.upcomingLeaseExpirations[0].id).toBe('lease-1')
		expect(result.upcomingLeaseExpirations[0].propertyAddress).toBe(
			'10 Main St',
		)
		expect(result.upcomingLeaseExpirations[0].tenantName).toBe('Alice Smith')
		expect(
			result.upcomingLeaseExpirations[0].daysUntilExpiry,
		).toBeGreaterThanOrEqual(14)
		expect(
			result.upcomingLeaseExpirations[0].daysUntilExpiry,
		).toBeLessThanOrEqual(16)
	})

	it('maps notifications to recent activity with correct action types', async () => {
		const prisma = makePrisma({
			notification: {
				findMany: vi.fn().mockResolvedValue([
					{
						id: 'n-1',
						title: 'Maintenance request updated',
						actionType: 'MAINTENANCE_UPDATE',
						createdAt: new Date('2026-03-18T10:00:00Z'),
					},
					{
						id: 'n-2',
						title: 'Payment received',
						actionType: 'PAYMENT_RECEIVED',
						createdAt: new Date('2026-03-17T09:00:00Z'),
					},
					{
						id: 'n-3',
						title: 'Document uploaded',
						actionType: 'UPLOAD_DOCUMENT',
						createdAt: new Date('2026-03-16T08:00:00Z'),
					},
					{
						id: 'n-4',
						title: 'Lease signed',
						actionType: 'SIGN_LEASE',
						createdAt: new Date('2026-03-15T07:00:00Z'),
					},
				]),
			},
		})
		const controller = new GetDashboardSummaryController(
			prisma as unknown as PrismaService,
		)

		const result = await controller.handle(makeUser())

		expect(result.recentActivity).toHaveLength(4)
		expect(result.recentActivity[0]).toEqual({
			id: 'n-1',
			type: 'MAINTENANCE_REQUEST',
			title: 'Maintenance request updated',
			timestamp: '2026-03-18T10:00:00.000Z',
		})
		expect(result.recentActivity[1].type).toBe('PAYMENT')
		expect(result.recentActivity[2].type).toBe('DOCUMENT_UPLOAD')
		expect(result.recentActivity[3].type).toBe('LEASE_ACTIVATION')
	})

	it('queries are scoped to the authenticated manager id', async () => {
		const prisma = makePrisma()
		const controller = new GetDashboardSummaryController(
			prisma as unknown as PrismaService,
		)

		await controller.handle(makeUser('manager-xyz'))

		expect(prisma.property.groupBy).toHaveBeenCalledWith(
			expect.objectContaining({ where: { managerId: 'manager-xyz' } }),
		)
		expect(prisma.lease.count).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					property: { managerId: 'manager-xyz' },
				}),
			}),
		)
	})
})
