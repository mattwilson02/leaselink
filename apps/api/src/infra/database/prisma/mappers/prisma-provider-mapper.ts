import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { IdentityProvider } from '@/domain/authentication/enterprise/entities/identity-provider'
import { AuthUserType } from '@/domain/financial-management/enterprise/entities/value-objects/auth-user-type'

import {
	Prisma,
	IdentityProvider as PrismaIdentityProvider,
} from '@prisma/client'

export class PrismaProviderMapper {
	static toDomain(raw: PrismaIdentityProvider): IdentityProvider {
		return IdentityProvider.create(
			{
				clientId: new UniqueEntityId(raw.userId),
				provider: raw.provider,
				providerUserId: raw.providerUserId,
				userType: AuthUserType.create({
					value: raw.userType,
				}),
			},
			new UniqueEntityId(raw.id),
		)
	}

	static toPrisma(
		identityProvider: IdentityProvider,
	): Prisma.IdentityProviderUncheckedCreateInput {
		return {
			id: identityProvider.id.toString(),
			userId: identityProvider.clientId.toString(),
			provider: identityProvider.provider ?? 'BETTER_AUTH',
			providerUserId: identityProvider.providerUserId,
			userType: identityProvider.userType.value,
		}
	}
}
