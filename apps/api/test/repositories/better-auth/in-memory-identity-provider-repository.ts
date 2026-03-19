import { IdentityProviderRepository } from '@/domain/authentication/application/repositories/identity-provider-repository'
import { IdentityProvider } from '@/domain/authentication/enterprise/entities/identity-provider'

export class InMemoryIdentityProvidersRepository
	implements IdentityProviderRepository
{
	public items: IdentityProvider[] = []

	async create(
		identityProvider: IdentityProvider,
	): Promise<IdentityProvider | null> {
		this.items.push(identityProvider)

		return Promise.resolve(identityProvider)
	}

	async delete(identityProviderId: string): Promise<void> {
		this.items = this.items.filter(
			(identityProvider) =>
				identityProvider.id.toString() !== identityProviderId,
		)
	}

	async findByClientId(clientId: string): Promise<IdentityProvider | null> {
		const identityProvider = this.items.find(
			(identityProvider) => identityProvider.clientId.toString() === clientId,
		)

		return Promise.resolve(identityProvider ?? null)
	}

	async findByProviderId(
		providerUserId: string,
	): Promise<IdentityProvider | null> {
		const identityProvider = this.items.find(
			(identityProvider) => identityProvider.providerUserId === providerUserId,
		)

		return Promise.resolve(identityProvider ?? null)
	}
}
