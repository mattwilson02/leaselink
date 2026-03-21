import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Property } from '../../enterprise/entities/property'
import { PropertiesRepository } from '../repositories/properties-repository'
import { PropertyNotFoundError } from './errors/property-not-found-error'
import { InvalidPropertyStatusTransitionError } from './errors/invalid-property-status-transition-error'
import { PropertyHasActiveLeaseError } from './errors/property-has-active-lease-error'
import {
	PROPERTY_STATUS_TRANSITIONS,
	isValidTransition,
	PropertyStatus as SharedPropertyStatus,
} from '@leaselink/shared'
import type { PropertyStatusType } from '../../enterprise/entities/value-objects/property-status'

export interface UpdatePropertyStatusUseCaseRequest {
	propertyId: string
	managerId: string
	status: string
}

type UpdatePropertyStatusUseCaseResponse = Either<
	| PropertyNotFoundError
	| InvalidPropertyStatusTransitionError
	| PropertyHasActiveLeaseError,
	{ property: Property }
>

@Injectable()
export class UpdatePropertyStatusUseCase {
	constructor(private propertiesRepository: PropertiesRepository) {}

	async execute(
		request: UpdatePropertyStatusUseCaseRequest,
	): Promise<UpdatePropertyStatusUseCaseResponse> {
		const property = await this.propertiesRepository.findById(
			request.propertyId,
		)

		if (!property || property.managerId.toString() !== request.managerId) {
			return left(new PropertyNotFoundError(request.propertyId))
		}

		const currentStatus = property.status
		const newStatus = request.status

		if (
			!isValidTransition(
				PROPERTY_STATUS_TRANSITIONS,
				currentStatus as unknown as SharedPropertyStatus,
				newStatus as unknown as SharedPropertyStatus,
			)
		) {
			return left(
				new InvalidPropertyStatusTransitionError(currentStatus, newStatus),
			)
		}

		// Business rule: OCCUPIED -> VACANT only when no active lease
		if (currentStatus === 'OCCUPIED' && newStatus === 'VACANT') {
			const hasActiveLease = await this.propertiesRepository.hasActiveLease(
				request.propertyId,
			)
			if (hasActiveLease) {
				return left(new PropertyHasActiveLeaseError(request.propertyId))
			}
		}

		property.status = newStatus as PropertyStatusType

		const updated = await this.propertiesRepository.update(property)

		return right({ property: updated })
	}
}
