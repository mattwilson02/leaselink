import { Either, left, right } from '@/core/either'

import { Injectable } from '@nestjs/common'
import { Session } from '../../enterprise/entities/session'
import { AuthError } from './errors/auth-error'
import { AuthUserType } from '@/domain/financial-management/enterprise/entities/value-objects/auth-user-type'
import { SessionRepository } from '../repositories/session-repository'

export interface CreateSessionRequest {
	userType: AuthUserType
}

type CreateSessionResponse = Either<
	AuthError,
	{
		session: Session
	}
>

@Injectable()
export class CreateSession {
	constructor(private sessionRepository: SessionRepository) {}

	async execute({
		userType,
	}: CreateSessionRequest): Promise<CreateSessionResponse> {
		const result = await this.sessionRepository.create(userType)

		if (result.isLeft()) {
			return left(result.value)
		}

		return right({
			session: result.value,
		})
	}
}
