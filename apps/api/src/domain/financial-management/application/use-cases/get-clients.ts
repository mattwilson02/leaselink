import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Client } from '../../enterprise/entities/client'
import { ClientsRepository } from '../repositories/clients-repository'

export interface GetClientsUseCaseRequest {
	status?: string
	onboardingStatus?: string
	search?: string
	page: number
	pageSize: number
}

type GetClientsUseCaseResponse = Either<
	never,
	{
		clients: Client[]
		totalCount: number
	}
>

@Injectable()
export class GetClientsUseCase {
	constructor(private clientsRepository: ClientsRepository) {}

	async execute(
		request: GetClientsUseCaseRequest,
	): Promise<GetClientsUseCaseResponse> {
		const { clients, totalCount } = await this.clientsRepository.findMany({
			status: request.status,
			onboardingStatus: request.onboardingStatus,
			search: request.search,
			page: request.page,
			pageSize: request.pageSize,
		})

		return right({ clients, totalCount })
	}
}
