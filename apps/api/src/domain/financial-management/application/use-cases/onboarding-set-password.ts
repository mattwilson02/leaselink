import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ClientsRepository } from '../repositories/clients-repository'
import { ClientNotFoundError } from './errors/client-not-found-error'
import { InvalidOnboardingTokenError } from './errors/invalid-onboarding-token-error'
import { PasswordChangeError } from './errors/password-change-error'
import { IdentityProviderRepository } from '@/domain/authentication/application/repositories/identity-provider-repository'
import { UsersAuthRepository } from '@/domain/authentication/application/repositories/user-auth-repository'

export interface OnboardingSetPasswordUseCaseRequest {
	clientId: string
	newPassword: string
	sessionToken: string
}

type OnboardingSetPasswordUseCaseResponse = Either<
	ClientNotFoundError | InvalidOnboardingTokenError | PasswordChangeError,
	{
		success: true
	}
>

@Injectable()
export class OnboardingSetPasswordUseCase {
	constructor(
		private clientsRepository: ClientsRepository,
		private identityProviderRepository: IdentityProviderRepository,
		private usersAuthRepository: UsersAuthRepository,
	) {}

	async execute({
		clientId,
		newPassword,
		sessionToken,
	}: OnboardingSetPasswordUseCaseRequest): Promise<OnboardingSetPasswordUseCaseResponse> {
		// Find the client
		const client = await this.clientsRepository.findById(clientId)

		if (!client) {
			return left(new ClientNotFoundError())
		}

		// Get the onboarding token
		const onboardingToken = client.onboardingToken

		if (!onboardingToken) {
			return left(new InvalidOnboardingTokenError())
		}

		// Get the identity provider to find the auth user ID
		const identityProvider =
			await this.identityProviderRepository.findByClientId(clientId)

		if (!identityProvider) {
			return left(new ClientNotFoundError())
		}

		const authUserId = identityProvider.providerUserId.toString()

		// Change the password using the onboarding token as the current password
		const changePasswordResult = await this.usersAuthRepository.changePassword(
			authUserId,
			onboardingToken,
			newPassword,
			sessionToken,
		)

		if (changePasswordResult.isLeft()) {
			return left(new PasswordChangeError(changePasswordResult.value.message))
		}

		// Clear the onboarding token and update the onboarding status
		client.onboardingStatus = 'PASSWORD_SET'
		client.onboardingToken = null

		await this.clientsRepository.update(client)

		return right({
			success: true,
		})
	}
}
