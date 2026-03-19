import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ClientsRepository } from '../repositories/clients-repository'
import { ClientNotFoundError } from './errors/client-not-found-error'

export interface GetClientProfilePhotoUseCaseRequest {
	clientId: string
}

type GetClientProfilePhotoUseCaseResponse = Either<
	ClientNotFoundError,
	{
		profilePhoto: string | null
	}
>

@Injectable()
export class GetClientProfilePhotoUseCase {
	constructor(private clientsRepository: ClientsRepository) {}

	async execute({
		clientId,
	}: GetClientProfilePhotoUseCaseRequest): Promise<GetClientProfilePhotoUseCaseResponse> {
		const client = await this.clientsRepository.findById(clientId)

		if (!client) {
			return left(new ClientNotFoundError())
		}

		return right({
			profilePhoto: client.profilePhoto,
		})
	}
}
