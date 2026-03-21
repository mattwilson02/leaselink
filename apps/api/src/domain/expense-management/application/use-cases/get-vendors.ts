import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Vendor } from '../../enterprise/entities/vendor'
import {
	VendorsRepository,
	VendorsFilterParams,
} from '../repositories/vendors-repository'

export interface GetVendorsUseCaseRequest {
	managerId: string
	specialty?: string
	search?: string
	page: number
	pageSize: number
}

type GetVendorsUseCaseResponse = Either<
	never,
	{ vendors: Vendor[]; totalCount: number }
>

@Injectable()
export class GetVendorsUseCase {
	constructor(private vendorsRepository: VendorsRepository) {}

	async execute(
		request: GetVendorsUseCaseRequest,
	): Promise<GetVendorsUseCaseResponse> {
		const params: VendorsFilterParams = {
			managerId: request.managerId,
			specialty: request.specialty,
			search: request.search,
			page: request.page,
			pageSize: request.pageSize,
		}

		const { vendors, totalCount } =
			await this.vendorsRepository.findManyByManager(params)

		return right({ vendors, totalCount })
	}
}
