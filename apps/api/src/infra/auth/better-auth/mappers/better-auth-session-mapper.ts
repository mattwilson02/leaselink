import { BetterAuthSessionTokenAndUser } from '@/domain/authentication/application/repositories/session-repository'
import { Session } from '@/domain/authentication/enterprise/entities/session'

export class BetterAuthSessionMapper {
	static toDomain(raw: BetterAuthSessionTokenAndUser): Session {
		return Session.create({
			authUserId: raw.user.id,
			token: raw.token,
		})
	}
}
