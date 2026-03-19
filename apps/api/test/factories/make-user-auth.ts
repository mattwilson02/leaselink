import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
	UserAuth,
	UserAuthProps,
} from '@/domain/authentication/enterprise/entities/user-auth'
import { faker } from '@faker-js/faker'

export const makeUserAuth = (
	override: Partial<UserAuthProps> = {},
	id?: UniqueEntityId,
) => {
	const enwUserAuth = UserAuth.create(
		{
			password: `${faker.internet.password({ length: 12 })}Aa1!`,
			email: faker.internet.email(),
			phoneNumber: `+44${faker.string.numeric(10)}`,
			name: faker.person.fullName(),
			...override,
		},
		id,
	)

	return enwUserAuth
}
