import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Lease } from '@/domain/lease-management/enterprise/entities/lease'
import { LeaseStatus } from '@/domain/lease-management/enterprise/entities/value-objects/lease-status'
import { Prisma, Lease as PrismaLease } from '@prisma/client'

export class PrismaLeaseMapper {
	static toDomain(raw: PrismaLease): Lease {
		return Lease.create(
			{
				propertyId: new UniqueEntityId(raw.propertyId),
				tenantId: new UniqueEntityId(raw.tenantId),
				startDate: raw.startDate,
				endDate: raw.endDate,
				monthlyRent: raw.monthlyRent,
				securityDeposit: raw.securityDeposit,
				status: LeaseStatus.create(raw.status),
				renewedFromLeaseId: raw.renewedFromLeaseId
					? new UniqueEntityId(raw.renewedFromLeaseId)
					: null,
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt,
			},
			new UniqueEntityId(raw.id),
		)
	}

	static toPrisma(lease: Lease): Prisma.LeaseUncheckedCreateInput {
		return {
			id: lease.id.toString(),
			propertyId: lease.propertyId.toString(),
			tenantId: lease.tenantId.toString(),
			startDate: lease.startDate,
			endDate: lease.endDate,
			monthlyRent: lease.monthlyRent,
			securityDeposit: lease.securityDeposit,
			status: lease.status as any,
			renewedFromLeaseId: lease.renewedFromLeaseId?.toString() ?? null,
			createdAt: lease.createdAt,
			updatedAt: lease.updatedAt ?? undefined,
		}
	}
}
