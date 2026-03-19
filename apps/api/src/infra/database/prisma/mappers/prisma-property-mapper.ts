import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Property } from '@/domain/property-management/enterprise/entities/property'
import { PropertyStatus } from '@/domain/property-management/enterprise/entities/value-objects/property-status'
import { PropertyType } from '@/domain/property-management/enterprise/entities/value-objects/property-type'
import { Prisma, Property as PrismaProperty } from '@prisma/client'

export class PrismaPropertyMapper {
	static toDomain(raw: PrismaProperty): Property {
		return Property.create(
			{
				managerId: new UniqueEntityId(raw.managerId),
				address: raw.address,
				city: raw.city,
				state: raw.state,
				zipCode: raw.zipCode,
				propertyType: PropertyType.create(raw.propertyType),
				bedrooms: raw.bedrooms,
				bathrooms: raw.bathrooms,
				sqft: raw.sqft,
				rentAmount: raw.rentAmount,
				status: PropertyStatus.create(raw.status),
				description: raw.description,
				photos: raw.photos,
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt,
			},
			new UniqueEntityId(raw.id),
		)
	}

	static toPrisma(property: Property): Prisma.PropertyUncheckedCreateInput {
		return {
			id: property.id.toString(),
			managerId: property.managerId.toString(),
			address: property.address,
			city: property.city,
			state: property.state,
			zipCode: property.zipCode,
			propertyType: property.propertyType,
			bedrooms: property.bedrooms,
			bathrooms: property.bathrooms,
			sqft: property.sqft,
			rentAmount: property.rentAmount,
			status: property.status,
			description: property.description,
			photos: property.photos,
			createdAt: property.createdAt,
			updatedAt: property.updatedAt ?? undefined,
		}
	}
}
