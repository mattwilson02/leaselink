import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Lease } from '../../enterprise/entities/lease'
import { LeasesRepository } from '../repositories/leases-repository'
import { LeaseNotFoundError } from './errors/lease-not-found-error'

export interface GetLeaseByIdUseCaseRequest {
	leaseId: string
}

type GetLeaseByIdUseCaseResponse = Either<LeaseNotFoundError, { lease: Lease }>

@Injectable()
export class GetLeaseByIdUseCase {
	constructor(private leasesRepository: LeasesRepository) {}

	async execute({
		leaseId,
	}: GetLeaseByIdUseCaseRequest): Promise<GetLeaseByIdUseCaseResponse> {
		const lease = await this.leasesRepository.findById(leaseId)

		if (!lease) {
			return left(new LeaseNotFoundError())
		}

		return right({ lease })
	}
}
