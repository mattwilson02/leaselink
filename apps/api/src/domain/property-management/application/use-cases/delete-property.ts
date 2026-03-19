import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { PropertiesRepository } from '../repositories/properties-repository'
import { PropertyNotFoundError } from './errors/property-not-found-error'
import { PropertyHasActiveLeaseError } from './errors/property-has-active-lease-error'

export interface DeletePropertyUseCaseRequest {
	propertyId: string
	managerId: string
}

type DeletePropertyUseCaseResponse = Either<
	PropertyNotFoundError | PropertyHasActiveLeaseError,
	null
>

@Injectable()
export class DeletePropertyUseCase {
	constructor(private propertiesRepository: PropertiesRepository) {}

	async execute({
		propertyId,
		managerId,
	}: DeletePropertyUseCaseRequest): Promise<DeletePropertyUseCaseResponse> {
		const property = await this.propertiesRepository.findById(propertyId)

		if (!property || property.managerId.toString() !== managerId) {
			return left(new PropertyNotFoundError(propertyId))
		}

		const hasActiveLease =
			await this.propertiesRepository.hasActiveLease(propertyId)
		if (hasActiveLease) {
			return left(new PropertyHasActiveLeaseError(propertyId))
		}

		await this.propertiesRepository.delete(propertyId)

		return right(null)
	}
}
