import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { UserAuth } from '@/domain/authentication/enterprise/entities/user-auth'

type BetterAuthUser = {
	id: string
	email: string
	name: string
	image?: string | null | undefined
	emailVerified: boolean
	createdAt: Date
	updatedAt: Date
	phoneNumber: string
}

export class BetterAuthUserMapper {
	static toDomain(raw: BetterAuthUser): UserAuth {
		return UserAuth.create(
			{
				email: raw.email,
				phoneNumber: raw.phoneNumber,
				name: raw.name,
			},
			new UniqueEntityId(raw.id),
		)
	}
}
