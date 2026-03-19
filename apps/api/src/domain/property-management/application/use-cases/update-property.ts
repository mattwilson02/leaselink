import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Property } from '../../enterprise/entities/property'
import { PropertiesRepository } from '../repositories/properties-repository'
import { PropertyNotFoundError } from './errors/property-not-found-error'
import type { PropertyTypeValue } from '../../enterprise/entities/value-objects/property-type'

export interface UpdatePropertyUseCaseRequest {
	propertyId: string
	managerId: string
	address?: string
	city?: string
	state?: string
	zipCode?: string
	propertyType?: string
	bedrooms?: number
	bathrooms?: number
	sqft?: number | null
	rentAmount?: number
	description?: string | null
}

type UpdatePropertyUseCaseResponse = Either<
	PropertyNotFoundError,
	{ property: Property }
>

@Injectable()
export class UpdatePropertyUseCase {
	constructor(private propertiesRepository: PropertiesRepository) {}

	async execute(
		request: UpdatePropertyUseCaseRequest,
	): Promise<UpdatePropertyUseCaseResponse> {
		const property = await this.propertiesRepository.findById(
			request.propertyId,
		)

		if (!property || property.managerId.toString() !== request.managerId) {
			return left(new PropertyNotFoundError(request.propertyId))
		}

		if (request.address !== undefined) property.address = request.address
		if (request.city !== undefined) property.city = request.city
		if (request.state !== undefined) property.state = request.state
		if (request.zipCode !== undefined) property.zipCode = request.zipCode
		if (request.propertyType !== undefined)
			property.propertyType = request.propertyType as PropertyTypeValue
		if (request.bedrooms !== undefined) property.bedrooms = request.bedrooms
		if (request.bathrooms !== undefined) property.bathrooms = request.bathrooms
		if (request.sqft !== undefined) property.sqft = request.sqft
		if (request.rentAmount !== undefined)
			property.rentAmount = request.rentAmount
		if (request.description !== undefined)
			property.description = request.description

		const updated = await this.propertiesRepository.update(property)

		return right({ property: updated })
	}
}
