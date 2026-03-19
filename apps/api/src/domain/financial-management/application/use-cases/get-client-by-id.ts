import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Client } from '../../enterprise/entities/client'
import { ClientsRepository } from '../repositories/clients-repository'
import { ClientNotFoundError } from './errors/client-not-found-error'

export interface GetClientByIdUseCaseRequest {
	clientId: string
}

type GetClientByIdUseCaseResponse = Either<
	ClientNotFoundError,
	{ client: Client }
>

@Injectable()
export class GetClientByIdUseCase {
	constructor(private clientsRepository: ClientsRepository) {}

	async execute({
		clientId,
	}: GetClientByIdUseCaseRequest): Promise<GetClientByIdUseCaseResponse> {
		const client = await this.clientsRepository.findById(clientId)

		if (!client) {
			return left(new ClientNotFoundError())
		}

		return right({ client })
	}
}
