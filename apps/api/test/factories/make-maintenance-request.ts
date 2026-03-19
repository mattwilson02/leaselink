import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
	MaintenanceRequest,
	MaintenanceRequestProps,
} from '@/domain/maintenance/enterprise/entities/maintenance-request'
import { MaintenanceCategory } from '@/domain/maintenance/enterprise/entities/value-objects/maintenance-category'
import { faker } from '@faker-js/faker'

export const makeMaintenanceRequest = (
	override: Partial<MaintenanceRequestProps> = {},
	id?: UniqueEntityId,
) => {
	return MaintenanceRequest.create(
		{
			propertyId: new UniqueEntityId(),
			tenantId: new UniqueEntityId(),
			title: faker.lorem.sentence(),
			description: faker.lorem.paragraph(),
			category: MaintenanceCategory.create('PLUMBING'),
			...override,
		},
		id,
	)
}
