import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersAuthRepository } from '../repositories/user-auth-repository'
import { InvalidPasswordError } from './errors/invalid-password-error'

export interface VerifyPasswordUseCaseRequest {
	authUserId: string
	password: string
}

type VerifyPasswordUseCaseResponse = Either<
	InvalidPasswordError,
	{
		success: true
	}
>

@Injectable()
export class VerifyPasswordUseCase {
	constructor(private usersAuthRepository: UsersAuthRepository) {}

	async execute({
		authUserId,
		password,
	}: VerifyPasswordUseCaseRequest): Promise<VerifyPasswordUseCaseResponse> {
		const result = await this.usersAuthRepository.verifyPassword(
			authUserId,
			password,
		)

		if (result.isLeft()) {
			return left(new InvalidPasswordError())
		}

		return right({
			success: true,
		})
	}
}
