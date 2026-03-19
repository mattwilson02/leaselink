import { Either, left, right } from '@/core/either'
import { AuthError } from '@/domain/authentication/application/use-cases/errors/auth-error'
import { Injectable } from '@nestjs/common'
import { AuthService } from '@thallesp/nestjs-better-auth'
import { SessionRepository } from '@/domain/authentication/application/repositories/session-repository'
import { AuthUserType } from '@/domain/financial-management/enterprise/entities/value-objects/auth-user-type'
import { BetterAuthSessionMapper } from '../mappers/better-auth-session-mapper'
import { Session } from '@/domain/authentication/enterprise/entities/session'

@Injectable()
export class BetterAuthSessionRepository implements SessionRepository {
	constructor(private readonly betterAuth: AuthService) {}

	async create(userType: AuthUserType): Promise<Either<AuthError, Session>> {
		try {
			const response = await this.betterAuth.api.signInEmail({
				body: {
					email:
						userType.value === 'EMPLOYEE'
							? 'employee@mail.com'
							: 'client@mail.com',
					password: 'Password123!',
				},
			})

			if (!response.token || !response.user) {
				return left(new AuthError({ errors: [{ message: 'User not found' }] }))
			}

			return right(BetterAuthSessionMapper.toDomain(response))
		} catch (error) {
			return left(error)
		}
	}
}
