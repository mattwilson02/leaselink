import { makeClient } from 'test/factories/make-client'
import { makeUserAuth } from 'test/factories/make-user-auth'
import { InMemoryIdentityProvidersRepository } from 'test/repositories/better-auth/in-memory-identity-provider-repository'
import { InMemoryUsersAuthRepository } from 'test/repositories/better-auth/in-memory-users-auth-repository'
import { InMemoryClientsRepository } from 'test/repositories/prisma/in-memory-clients-repository'
import { OnboardingSetPasswordUseCase } from './onboarding-set-password'
import { ClientNotFoundError } from './errors/client-not-found-error'
import { InvalidOnboardingTokenError } from './errors/invalid-onboarding-token-error'
import { PasswordChangeError } from './errors/password-change-error'
import { IdentityProvider } from '@/domain/authentication/enterprise/entities/identity-provider'
import { AuthUserType } from '@/domain/financial-management/enterprise/entities/value-objects/auth-user-type'

let inMemoryClientsRepository: InMemoryClientsRepository
let inMemoryUsersAuthRepository: InMemoryUsersAuthRepository
let inMemoryIdentityProvidersRepository: InMemoryIdentityProvidersRepository
let sut: OnboardingSetPasswordUseCase

describe('Onboarding Set Password', () => {
	beforeEach(() => {
		inMemoryClientsRepository = new InMemoryClientsRepository()
		inMemoryUsersAuthRepository = new InMemoryUsersAuthRepository()
		inMemoryIdentityProvidersRepository =
			new InMemoryIdentityProvidersRepository()
		sut = new OnboardingSetPasswordUseCase(
			inMemoryClientsRepository,
			inMemoryIdentityProvidersRepository,
			inMemoryUsersAuthRepository,
		)
	})

	it('should set password during onboarding', async () => {
		const onboardingToken = 'test-onboarding-token-123'
		const client = makeClient({ onboardingToken })
		inMemoryClientsRepository.items.push(client)

		const userAuth = makeUserAuth({
			email: client.email,
			password: onboardingToken,
		})
		inMemoryUsersAuthRepository.items.push(userAuth)

		const identityProvider = IdentityProvider.create({
			providerUserId: userAuth.id.toString(),
			clientId: client.id,
			provider: 'BETTER_AUTH',
			userType: AuthUserType.create({
				value: 'CLIENT',
			}),
		})
		inMemoryIdentityProvidersRepository.items.push(identityProvider)

		const newPassword = 'MyNewSecurePassword123!'

		const result = await sut.execute({
			clientId: client.id.toString(),
			newPassword,
			sessionToken: 'test-session-token',
		})

		expect(result.isRight()).toBeTruthy()
		expect(result.value).toEqual({ success: true })

		// Verify password was changed
		const updatedUser = inMemoryUsersAuthRepository.items.find(
			(u) => u.id.toString() === userAuth.id.toString(),
		)
		expect(updatedUser?.password).toBe(newPassword)

		// Verify onboarding status was updated and token was cleared
		const updatedClient = inMemoryClientsRepository.items.find(
			(c) => c.id.toString() === client.id.toString(),
		)
		expect(updatedClient?.onboardingStatus).toBe('PASSWORD_SET')
		expect(updatedClient?.onboardingToken).toBe(null)
	})

	it('should not set password for non-existent client', async () => {
		const result = await sut.execute({
			clientId: 'non-existent-client-id',
			newPassword: 'MyNewSecurePassword123!',
			sessionToken: 'test-session-token',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ClientNotFoundError)
	})

	it('should not set password if onboarding token is missing', async () => {
		const client = makeClient({ onboardingToken: null })
		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({
			clientId: client.id.toString(),
			newPassword: 'MyNewSecurePassword123!',
			sessionToken: 'test-session-token',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(InvalidOnboardingTokenError)
	})

	it('should not set password if identity provider is not found', async () => {
		const onboardingToken = 'test-onboarding-token-123'
		const client = makeClient({ onboardingToken })
		inMemoryClientsRepository.items.push(client)

		const result = await sut.execute({
			clientId: client.id.toString(),
			newPassword: 'MyNewSecurePassword123!',
			sessionToken: 'test-session-token',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(ClientNotFoundError)
	})

	it('should not set password if current password (onboarding token) is incorrect', async () => {
		const onboardingToken = 'test-onboarding-token-123'
		const client = makeClient({ onboardingToken })
		inMemoryClientsRepository.items.push(client)

		const userAuth = makeUserAuth({
			email: client.email,
			password: 'different-password', // Wrong password
		})
		inMemoryUsersAuthRepository.items.push(userAuth)

		const identityProvider = IdentityProvider.create({
			providerUserId: userAuth.id.toString(),
			clientId: client.id,
			provider: 'BETTER_AUTH',
			userType: AuthUserType.create({
				value: 'CLIENT',
			}),
		})
		inMemoryIdentityProvidersRepository.items.push(identityProvider)

		const result = await sut.execute({
			clientId: client.id.toString(),
			newPassword: 'MyNewSecurePassword123!',
			sessionToken: 'test-session-token',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(PasswordChangeError)
	})

	it('should not set password if user auth does not exist', async () => {
		const onboardingToken = 'test-onboarding-token-123'
		const client = makeClient({ onboardingToken })
		inMemoryClientsRepository.items.push(client)

		const identityProvider = IdentityProvider.create({
			providerUserId: 'non-existent-user-id',
			clientId: client.id,
			provider: 'BETTER_AUTH',
			userType: AuthUserType.create({
				value: 'CLIENT',
			}),
		})
		inMemoryIdentityProvidersRepository.items.push(identityProvider)

		const result = await sut.execute({
			clientId: client.id.toString(),
			newPassword: 'MyNewSecurePassword123!',
			sessionToken: 'test-session-token',
		})

		expect(result.isLeft()).toBeTruthy()
		expect(result.value).toBeInstanceOf(PasswordChangeError)
	})
})
