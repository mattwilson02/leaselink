import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Vendor } from '@/domain/expense-management/enterprise/entities/vendor'
import { MaintenanceCategory } from '@/domain/maintenance/enterprise/entities/value-objects/maintenance-category'
import { Prisma, Vendor as PrismaVendor } from '@prisma/client'

export class PrismaVendorMapper {
	static toDomain(raw: PrismaVendor): Vendor {
		return Vendor.create(
			{
				managerId: new UniqueEntityId(raw.managerId),
				name: raw.name,
				specialty: MaintenanceCategory.create(raw.specialty),
				phone: raw.phone,
				email: raw.email,
				notes: raw.notes,
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt,
			},
			new UniqueEntityId(raw.id),
		)
	}

	static toPrisma(vendor: Vendor): Prisma.VendorUncheckedCreateInput {
		return {
			id: vendor.id.toString(),
			managerId: vendor.managerId.toString(),
			name: vendor.name,
			specialty: vendor.specialty as any,
			phone: vendor.phone,
			email: vendor.email,
			notes: vendor.notes,
			createdAt: vendor.createdAt,
			updatedAt: vendor.updatedAt ?? undefined,
		}
	}
}
