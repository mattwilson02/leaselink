import { IdentityProvider } from '../../enterprise/entities/identity-provider'

export abstract class IdentityProviderRepository {
	abstract findByProviderId(
		providerId: string,
	): Promise<IdentityProvider | null>
	abstract findByClientId(clientId: string): Promise<IdentityProvider | null>
	abstract delete(identityProviderId: string): Promise<void>
	abstract create(
		identityProvider: IdentityProvider,
	): Promise<IdentityProvider | null>
}
