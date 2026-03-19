import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
	IdentityProvider,
	IdentityProviderProps,
} from '@/domain/authentication/enterprise/entities/identity-provider'
import { AuthUserType } from '@/domain/financial-management/enterprise/entities/value-objects/auth-user-type'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'

export const makeIdentityProvider = (
	override: Partial<IdentityProviderProps> = {},
	id?: UniqueEntityId,
) => {
	const identityProvider = IdentityProvider.create(
		{
			providerUserId: faker.string.uuid(),
			clientId: new UniqueEntityId(),
			userType: AuthUserType.create({
				value: 'CLIENT',
			}),
			...override,
		},
		id,
	)

	return identityProvider
}

@Injectable()
export class IdentityProviderFactory {
	constructor(private prisma: PrismaService) {}

	async makePrismaIdentityProvider(
		data: Partial<IdentityProviderProps> = {},
	): Promise<IdentityProvider> {
		const identityProvider = makeIdentityProvider(data)

		// Create in Prisma database
		// You would need to implement the mapper and create method as needed
		// await this.prisma.identityProvider.create({
		//   data: PrismaIdentityProviderMapper.toPrisma(identityProvider),
		// })

		return identityProvider
	}
}
