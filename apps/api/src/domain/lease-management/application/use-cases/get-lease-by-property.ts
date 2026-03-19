import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Lease } from '../../enterprise/entities/lease'
import { LeasesRepository } from '../repositories/leases-repository'

export interface GetLeaseByPropertyUseCaseRequest {
	propertyId: string
}

type GetLeaseByPropertyUseCaseResponse = Either<never, { lease: Lease | null }>

@Injectable()
export class GetLeaseByPropertyUseCase {
	constructor(private leasesRepository: LeasesRepository) {}

	async execute({
		propertyId,
	}: GetLeaseByPropertyUseCaseRequest): Promise<GetLeaseByPropertyUseCaseResponse> {
		const lease = await this.leasesRepository.findActiveByProperty(propertyId)

		return right({ lease })
	}
}
