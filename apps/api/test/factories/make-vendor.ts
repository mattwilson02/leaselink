import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
	Vendor,
	VendorProps,
} from '@/domain/expense-management/enterprise/entities/vendor'
import { MaintenanceCategory } from '@/domain/maintenance/enterprise/entities/value-objects/maintenance-category'
import { faker } from '@faker-js/faker'

export const makeVendor = (
	override: Partial<VendorProps> = {},
	id?: UniqueEntityId,
) => {
	return Vendor.create(
		{
			managerId: new UniqueEntityId(),
			name: faker.company.name(),
			specialty: MaintenanceCategory.create('PLUMBING'),
			phone: faker.phone.number(),
			email: faker.internet.email(),
			notes: null,
			...override,
		},
		id,
	)
}
