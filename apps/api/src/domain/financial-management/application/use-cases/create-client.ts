import { Either, left, right } from '@/core/either'
import { IdentityProviderRepository } from '@/domain/authentication/application/repositories/identity-provider-repository'
import { UsersAuthRepository } from '@/domain/authentication/application/repositories/user-auth-repository'
import { IdentityProvider } from '@/domain/authentication/enterprise/entities/identity-provider'
import { UserAuth } from '@/domain/authentication/enterprise/entities/user-auth'
import { Client } from '@/domain/financial-management/enterprise/entities/client'
import { Injectable } from '@nestjs/common'
import { AuthUserType } from '../../enterprise/entities/value-objects/auth-user-type'
import { ClientsRepository } from '../repositories/clients-repository'
import { ClientAlreadyExistsError } from './errors/client-already-exists-error'
import { CreateClientError } from './errors/create-client-error'

export interface CreateClientUseCaseRequest {
	name: string
	email: string
	phoneNumber: string
}

type CreateClientUseCaseResponse = Either<
	ClientAlreadyExistsError,
	{
		client: Client
	}
>

@Injectable()
export class CreateClientUseCase {
	constructor(
		private clientsRepository: ClientsRepository,
		private usersAuthRepository: UsersAuthRepository,
		private identityProviderRepository: IdentityProviderRepository,
	) {}

	async execute({
		name,
		email,
		phoneNumber,
	}: CreateClientUseCaseRequest): Promise<CreateClientUseCaseResponse> {
		const clientWithSameEmail = await this.clientsRepository.findByEmail(email)

		if (clientWithSameEmail) {
			return left(new ClientAlreadyExistsError(email))
		}

		// The onboarding token is used as a temporary password until the client
		// sets their own during onboarding. Append complexity chars to satisfy
		// password rules while keeping the UUID as the primary identifier.
		const onboardingToken = `${crypto.randomUUID()}A1!`

		const client = Client.create({
			name,
			email,
			phoneNumber,
			onboardingToken,
		})

		await this.clientsRepository.create(client)

		const userAuth = UserAuth.create({
			email,
			password: onboardingToken,
			name,
			phoneNumber,
		})

		const userAuthResponse = await this.usersAuthRepository.create(userAuth)

		if (userAuthResponse.isLeft()) {
			this.clientsRepository.delete(client.id.toString())
			return left(userAuthResponse.value)
		}

		const newIdentityProvider = IdentityProvider.create({
			providerUserId: userAuthResponse.value.id.toString(),
			clientId: client.id,
			provider: 'BETTER_AUTH',
			userType: AuthUserType.create({
				value: 'CLIENT',
			}),
		})

		const createdNewIdentifierResponse =
			await this.identityProviderRepository.create(newIdentityProvider)

		if (!createdNewIdentifierResponse) {
			await this.usersAuthRepository.delete(
				userAuthResponse.value.id.toString(),
			)
			await this.clientsRepository.delete(client.id.toString())
			return left(new CreateClientError())
		}

		return right({
			client,
		})
	}
}
