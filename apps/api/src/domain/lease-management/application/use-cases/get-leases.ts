import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Lease } from '../../enterprise/entities/lease'
import { LeasesRepository } from '../repositories/leases-repository'

export interface GetLeasesUseCaseRequest {
	status?: string
	propertyId?: string
	tenantId?: string
	page: number
	pageSize: number
}

type GetLeasesUseCaseResponse = Either<
	never,
	{
		leases: Lease[]
		totalCount: number
	}
>

@Injectable()
export class GetLeasesUseCase {
	constructor(private leasesRepository: LeasesRepository) {}

	async execute(
		request: GetLeasesUseCaseRequest,
	): Promise<GetLeasesUseCaseResponse> {
		const { leases, totalCount } = await this.leasesRepository.findMany({
			status: request.status,
			propertyId: request.propertyId,
			tenantId: request.tenantId,
			page: request.page,
			pageSize: request.pageSize,
		})

		return right({ leases, totalCount })
	}
}
