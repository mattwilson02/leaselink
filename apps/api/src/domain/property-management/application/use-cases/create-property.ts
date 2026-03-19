import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Property } from '../../enterprise/entities/property'
import { PropertyType } from '../../enterprise/entities/value-objects/property-type'
import { PropertiesRepository } from '../repositories/properties-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface CreatePropertyUseCaseRequest {
	managerId: string
	address: string
	city: string
	state: string
	zipCode: string
	propertyType: string
	bedrooms: number
	bathrooms: number
	sqft?: number
	rentAmount: number
	description?: string
}

type CreatePropertyUseCaseResponse = Either<never, { property: Property }>

@Injectable()
export class CreatePropertyUseCase {
	constructor(private propertiesRepository: PropertiesRepository) {}

	async execute(
		request: CreatePropertyUseCaseRequest,
	): Promise<CreatePropertyUseCaseResponse> {
		const property = Property.create({
			managerId: new UniqueEntityId(request.managerId),
			address: request.address,
			city: request.city,
			state: request.state,
			zipCode: request.zipCode,
			propertyType: PropertyType.create(request.propertyType),
			bedrooms: request.bedrooms,
			bathrooms: request.bathrooms,
			sqft: request.sqft ?? null,
			rentAmount: request.rentAmount,
			description: request.description ?? null,
		})

		await this.propertiesRepository.create(property)

		return right({ property })
	}
}
