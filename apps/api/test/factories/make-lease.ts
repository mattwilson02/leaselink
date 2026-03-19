import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
	Lease,
	LeaseProps,
} from '@/domain/lease-management/enterprise/entities/lease'
import { LeaseStatus } from '@/domain/lease-management/enterprise/entities/value-objects/lease-status'
import { faker } from '@faker-js/faker'

export const makeLease = (
	override: Partial<LeaseProps> = {},
	id?: UniqueEntityId,
) => {
	const startDate = faker.date.recent({ days: 30 })
	const endDate = new Date(startDate)
	endDate.setFullYear(endDate.getFullYear() + 1)

	return Lease.create(
		{
			propertyId: new UniqueEntityId(),
			tenantId: new UniqueEntityId(),
			startDate,
			endDate,
			monthlyRent: faker.number.float({
				min: 800,
				max: 5000,
				multipleOf: 0.01,
			}),
			securityDeposit: faker.number.float({
				min: 800,
				max: 10000,
				multipleOf: 0.01,
			}),
			status: LeaseStatus.create('PENDING'),
			...override,
		},
		id,
	)
}
