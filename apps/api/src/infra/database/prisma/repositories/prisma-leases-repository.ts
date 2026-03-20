import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type {
	LeasesRepository,
	LeasesFilterParams,
	LeasesPaginatedResult,
} from '@/domain/lease-management/application/repositories/leases-repository'
import type { Lease } from '@/domain/lease-management/enterprise/entities/lease'
import { PrismaLeaseMapper } from '../mappers/prisma-lease-mapper'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaLeasesRepository implements LeasesRepository {
	constructor(private prisma: PrismaService) {}

	async create(lease: Lease): Promise<void> {
		const data = PrismaLeaseMapper.toPrisma(lease)
		await this.prisma.lease.create({ data })
	}

	async findById(leaseId: string): Promise<Lease | null> {
		const lease = await this.prisma.lease.findUnique({
			where: { id: leaseId },
		})
		if (!lease) return null
		return PrismaLeaseMapper.toDomain(lease)
	}

	async findMany(params: LeasesFilterParams): Promise<LeasesPaginatedResult> {
		const where: Prisma.LeaseWhereInput = {}

		if (params.status) {
			where.status = params.status as any
		}

		if (params.propertyId) {
			where.propertyId = params.propertyId
		}

		if (params.tenantId) {
			where.tenantId = params.tenantId
		}

		const [leases, totalCount] = await Promise.all([
			this.prisma.lease.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip: (params.page - 1) * params.pageSize,
				take: params.pageSize,
			}),
			this.prisma.lease.count({ where }),
		])

		return {
			leases: leases.map(PrismaLeaseMapper.toDomain),
			totalCount,
		}
	}

	async findActiveByProperty(propertyId: string): Promise<Lease | null> {
		const lease = await this.prisma.lease.findFirst({
			where: { propertyId, status: 'ACTIVE' },
		})
		if (!lease) return null
		return PrismaLeaseMapper.toDomain(lease)
	}

	async findActiveByTenant(tenantId: string): Promise<Lease | null> {
		const lease = await this.prisma.lease.findFirst({
			where: { tenantId, status: 'ACTIVE' },
		})
		if (!lease) return null
		return PrismaLeaseMapper.toDomain(lease)
	}

	async findPendingRenewalByLeaseId(leaseId: string): Promise<Lease | null> {
		const lease = await this.prisma.lease.findFirst({
			where: { renewedFromLeaseId: leaseId, status: 'PENDING' },
		})
		if (!lease) return null
		return PrismaLeaseMapper.toDomain(lease)
	}

	async update(lease: Lease): Promise<Lease> {
		const data = PrismaLeaseMapper.toPrisma(lease)
		const updated = await this.prisma.lease.update({
			where: { id: lease.id.toString() },
			data,
		})
		return PrismaLeaseMapper.toDomain(updated)
	}

	async findActiveExpiringBetween(
		startDate: Date,
		endDate: Date,
	): Promise<Lease[]> {
		const leases = await this.prisma.lease.findMany({
			where: {
				status: 'ACTIVE',
				endDate: { gte: startDate, lte: endDate },
			},
		})
		return leases.map(PrismaLeaseMapper.toDomain)
	}

	async findAllActive(): Promise<Lease[]> {
		const leases = await this.prisma.lease.findMany({
			where: { status: 'ACTIVE' },
		})
		return leases.map(PrismaLeaseMapper.toDomain)
	}
}
