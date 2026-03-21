import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaVendorMapper } from '../mappers/prisma-vendor-mapper'
import type {
	VendorsRepository,
	VendorsFilterParams,
	VendorsPaginatedResult,
} from '@/domain/expense-management/application/repositories/vendors-repository'
import type { Vendor } from '@/domain/expense-management/enterprise/entities/vendor'
import { Prisma } from '@prisma/client'

@Injectable()
export class PrismaVendorsRepository implements VendorsRepository {
	constructor(private prisma: PrismaService) {}

	async create(vendor: Vendor): Promise<void> {
		const data = PrismaVendorMapper.toPrisma(vendor)
		await this.prisma.vendor.create({ data })
	}

	async findById(vendorId: string): Promise<Vendor | null> {
		const vendor = await this.prisma.vendor.findUnique({
			where: { id: vendorId },
		})
		if (!vendor) return null
		return PrismaVendorMapper.toDomain(vendor)
	}

	async findManyByManager(
		params: VendorsFilterParams,
	): Promise<VendorsPaginatedResult> {
		const where: Prisma.VendorWhereInput = {
			managerId: params.managerId,
		}

		if (params.specialty) {
			where.specialty = params.specialty as any
		}

		if (params.search) {
			where.OR = [
				{ name: { contains: params.search, mode: 'insensitive' } },
				{ email: { contains: params.search, mode: 'insensitive' } },
			]
		}

		const [vendors, totalCount] = await Promise.all([
			this.prisma.vendor.findMany({
				where,
				orderBy: { name: 'asc' },
				skip: (params.page - 1) * params.pageSize,
				take: params.pageSize,
			}),
			this.prisma.vendor.count({ where }),
		])

		return {
			vendors: vendors.map(PrismaVendorMapper.toDomain),
			totalCount,
		}
	}

	async update(vendor: Vendor): Promise<Vendor> {
		const data = PrismaVendorMapper.toPrisma(vendor)
		const updated = await this.prisma.vendor.update({
			where: { id: vendor.id.toString() },
			data,
		})
		return PrismaVendorMapper.toDomain(updated)
	}

	async delete(vendorId: string): Promise<void> {
		await this.prisma.vendor.delete({ where: { id: vendorId } })
	}

	async hasOpenMaintenanceRequests(vendorId: string): Promise<boolean> {
		const count = await this.prisma.maintenanceRequest.count({
			where: {
				vendorId,
				status: { in: ['OPEN', 'IN_PROGRESS'] },
			},
		})
		return count > 0
	}
}
