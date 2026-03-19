import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
	Property,
	PropertyProps,
} from '@/domain/property-management/enterprise/entities/property'
import { PropertyType } from '@/domain/property-management/enterprise/entities/value-objects/property-type'
import { faker } from '@faker-js/faker'

export const makeProperty = (
	override: Partial<PropertyProps> = {},
	id?: UniqueEntityId,
) => {
	return Property.create(
		{
			managerId: new UniqueEntityId(),
			address: faker.location.streetAddress(),
			city: faker.location.city(),
			state: faker.location.state({ abbreviated: true }),
			zipCode: faker.location.zipCode(),
			propertyType: PropertyType.create('APARTMENT'),
			bedrooms: faker.number.int({ min: 1, max: 5 }),
			bathrooms: faker.number.float({
				min: 1,
				max: 3,
				multipleOf: 0.5,
			}),
			sqft: faker.number.int({ min: 500, max: 3000 }),
			rentAmount: faker.number.float({
				min: 800,
				max: 5000,
				multipleOf: 0.01,
			}),
			description: faker.lorem.paragraph(),
			...override,
		},
		id,
	)
}
