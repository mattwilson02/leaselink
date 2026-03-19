import { Either, left, right } from '@/core/either'
import { Client } from '@/domain/financial-management/enterprise/entities/client'
import { Injectable } from '@nestjs/common'
import { ClientsRepository } from '../repositories/clients-repository'
import { ClientNotFoundError } from './errors/client-not-found-error'

export interface UploadClientProfilePhotoUseCaseRequest {
	clientId: string
	profilePhoto: string
}

type UploadClientProfilePhotoUseCaseResponse = Either<
	ClientNotFoundError,
	{
		client: Client
	}
>

@Injectable()
export class UploadClientProfilePhotoUseCase {
	constructor(private clientsRepository: ClientsRepository) {}

	async execute({
		clientId,
		profilePhoto,
	}: UploadClientProfilePhotoUseCaseRequest): Promise<UploadClientProfilePhotoUseCaseResponse> {
		const client = await this.clientsRepository.findById(clientId)

		if (!client) {
			return left(new ClientNotFoundError())
		}

		client.profilePhoto = profilePhoto

		await this.clientsRepository.update(client)

		return right({
			client,
		})
	}
}
