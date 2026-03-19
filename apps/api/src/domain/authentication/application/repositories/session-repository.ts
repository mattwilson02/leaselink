import { Either } from '@/core/either'
import { Session } from '../../enterprise/entities/session'
import { AuthError } from '../use-cases/errors/auth-error'
import { AuthUserType } from '@/domain/financial-management/enterprise/entities/value-objects/auth-user-type'

export type BetterAuthUser = {
	id: string
	email: string
	name: string
	image?: string | null | undefined
	emailVerified: boolean
	createdAt: Date
	updatedAt: Date
}

export type BetterAuthSessionTokenAndUser = {
	token: string
	user: BetterAuthUser
}

export abstract class SessionRepository {
	abstract create(userType: AuthUserType): Promise<Either<AuthError, Session>>
}
