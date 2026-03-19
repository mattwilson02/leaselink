import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Property } from '../../enterprise/entities/property'
import { PropertiesRepository } from '../repositories/properties-repository'

export interface GetPropertiesByManagerUseCaseRequest {
	managerId: string
	status?: string
	search?: string
	page: number
	pageSize: number
}

type GetPropertiesByManagerUseCaseResponse = Either<
	never,
	{
		properties: Property[]
		totalCount: number
	}
>

@Injectable()
export class GetPropertiesByManagerUseCase {
	constructor(private propertiesRepository: PropertiesRepository) {}

	async execute(
		request: GetPropertiesByManagerUseCaseRequest,
	): Promise<GetPropertiesByManagerUseCaseResponse> {
		const { properties, totalCount } =
			await this.propertiesRepository.findManyByManager({
				managerId: request.managerId,
				status: request.status,
				search: request.search,
				page: request.page,
				pageSize: request.pageSize,
			})

		return right({ properties, totalCount })
	}
}
