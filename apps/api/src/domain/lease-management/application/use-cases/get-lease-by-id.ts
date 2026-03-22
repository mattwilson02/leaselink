import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Lease } from '../../enterprise/entities/lease'
import { LeasesRepository } from '../repositories/leases-repository'
import { PropertiesRepository } from '@/domain/property-management/application/repositories/properties-repository'
import { LeaseNotFoundError } from './errors/lease-not-found-error'
import { LeaseForbiddenError } from './errors/lease-forbidden-error'

export interface GetLeaseByIdUseCaseRequest {
	leaseId: string
	requestingUserId: string
	requestingUserType: 'CLIENT' | 'EMPLOYEE'
}

type GetLeaseByIdUseCaseResponse = Either<
	LeaseNotFoundError | LeaseForbiddenError,
	{ lease: Lease }
>

@Injectable()
export class GetLeaseByIdUseCase {
	constructor(
		private leasesRepository: LeasesRepository,
		private propertiesRepository: PropertiesRepository,
	) {}

	async execute({
		leaseId,
		requestingUserId,
		requestingUserType,
	}: GetLeaseByIdUseCaseRequest): Promise<GetLeaseByIdUseCaseResponse> {
		const lease = await this.leasesRepository.findById(leaseId)

		if (requestingUserType === 'CLIENT') {
			if (!lease || lease.tenantId.toString() !== requestingUserId) {
				return left(new LeaseForbiddenError())
			}
		} else {
			if (!lease) {
				return left(new LeaseNotFoundError())
			}
			const property = await this.propertiesRepository.findById(
				lease.propertyId.toString(),
			)
			if (!property || property.managerId.toString() !== requestingUserId) {
				return left(new LeaseForbiddenError())
			}
		}

		return right({ lease })
	}
}
