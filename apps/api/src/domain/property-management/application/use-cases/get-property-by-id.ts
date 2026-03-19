import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Property } from '../../enterprise/entities/property'
import { PropertiesRepository } from '../repositories/properties-repository'
import { PropertyNotFoundError } from './errors/property-not-found-error'

export interface GetPropertyByIdUseCaseRequest {
	propertyId: string
	managerId: string
}

type GetPropertyByIdUseCaseResponse = Either<
	PropertyNotFoundError,
	{ property: Property }
>

@Injectable()
export class GetPropertyByIdUseCase {
	constructor(private propertiesRepository: PropertiesRepository) {}

	async execute({
		propertyId,
		managerId,
	}: GetPropertyByIdUseCaseRequest): Promise<GetPropertyByIdUseCaseResponse> {
		const property = await this.propertiesRepository.findById(propertyId)

		if (!property || property.managerId.toString() !== managerId) {
			return left(new PropertyNotFoundError(propertyId))
		}

		return right({ property })
	}
}
