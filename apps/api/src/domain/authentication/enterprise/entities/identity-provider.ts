import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { AuthUserType } from '@/domain/financial-management/enterprise/entities/value-objects/auth-user-type'

export interface IdentityProviderProps {
	clientId: UniqueEntityId
	provider?: string | null
	userType: AuthUserType
	providerUserId: string
}

export class IdentityProvider extends Entity<IdentityProviderProps> {
	get clientId() {
		return this.props.clientId
	}

	get provider() {
		return this.props.provider
	}

	get providerUserId() {
		return this.props.providerUserId
	}

	get userType() {
		return this.props.userType
	}

	static create(
		props: Optional<IdentityProviderProps, 'provider'>,
		id?: UniqueEntityId,
	) {
		const identityProvider = new IdentityProvider(
			{ ...props, provider: props.provider ?? 'BETTER_AUTH' },
			id,
		)

		return identityProvider
	}
}
