import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { IdentityProviderRepository } from '@/domain/authentication/application/repositories/identity-provider-repository'
import { UsersAuthRepository } from '@/domain/authentication/application/repositories/user-auth-repository'
import { Injectable } from '@nestjs/common'
import { ClientsRepository } from '../repositories/clients-repository'

export interface DeleteClientUseCaseRequest {
	clientId: string
}

type DeleteClientUseCaseResponse = Either<ResourceNotFoundError, null>

@Injectable()
export class DeleteClientUseCase {
	constructor(
		private clientsRepository: ClientsRepository,
		private identityProviderRepository: IdentityProviderRepository,
		private usersAuthRepository: UsersAuthRepository,
	) {}

	async execute({
		clientId,
	}: DeleteClientUseCaseRequest): Promise<DeleteClientUseCaseResponse> {
		const client = await this.clientsRepository.findById(clientId)

		if (!client) {
			return left(new ResourceNotFoundError())
		}

		const identityProvider =
			await this.identityProviderRepository.findByClientId(clientId)

		if (!identityProvider) {
			return left(new ResourceNotFoundError())
		}

		const deletedUserAuthResponse = await this.usersAuthRepository.delete(
			identityProvider.providerUserId,
		)

		if (deletedUserAuthResponse.isLeft()) {
			return left(deletedUserAuthResponse.value)
		}

		await this.identityProviderRepository.delete(identityProvider.id.toString())
		await this.clientsRepository.delete(clientId)

		return right(null)
	}
}
