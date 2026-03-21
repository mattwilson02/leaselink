import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaPropertyMapper } from '../mappers/prisma-property-mapper'
import type {
	PropertiesRepository,
	PropertiesFilterParams,
	PropertiesPaginatedResult,
} from '@/domain/property-management/application/repositories/properties-repository'
import type { Property } from '@/domain/property-management/enterprise/entities/property'
import { Prisma, PROPERTY_STATUS } from '@prisma/client'

@Injectable()
export class PrismaPropertiesRepository implements PropertiesRepository {
	constructor(private prisma: PrismaService) {}

	async create(property: Property): Promise<void> {
		const data = PrismaPropertyMapper.toPrisma(property)
		await this.prisma.property.create({ data })
	}

	async findById(propertyId: string): Promise<Property | null> {
		const property = await this.prisma.property.findUnique({
			where: { id: propertyId },
		})
		if (!property) return null
		return PrismaPropertyMapper.toDomain(property)
	}

	async findManyByManager(
		params: PropertiesFilterParams,
	): Promise<PropertiesPaginatedResult> {
		const where: Prisma.PropertyWhereInput = {
			managerId: params.managerId,
		}

		if (params.status) {
			where.status = params.status as PROPERTY_STATUS
		}

		if (params.search) {
			where.OR = [
				{
					address: {
						contains: params.search,
						mode: 'insensitive',
					},
				},
				{
					city: {
						contains: params.search,
						mode: 'insensitive',
					},
				},
			]
		}

		const [properties, totalCount] = await Promise.all([
			this.prisma.property.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip: (params.page - 1) * params.pageSize,
				take: params.pageSize,
			}),
			this.prisma.property.count({ where }),
		])

		return {
			properties: properties.map(PrismaPropertyMapper.toDomain),
			totalCount,
		}
	}

	async update(property: Property): Promise<Property> {
		const data = PrismaPropertyMapper.toPrisma(property)
		const updated = await this.prisma.property.update({
			where: { id: property.id.toString() },
			data,
		})
		return PrismaPropertyMapper.toDomain(updated)
	}

	async delete(propertyId: string): Promise<void> {
		await this.prisma.property.delete({
			where: { id: propertyId },
		})
	}

	async hasActiveLease(propertyId: string): Promise<boolean> {
		const count = await this.prisma.lease.count({
			where: {
				propertyId,
				status: 'ACTIVE',
			},
		})
		return count > 0
	}
}
