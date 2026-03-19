import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersAuthRepository } from '../repositories/user-auth-repository'
import { AuthError } from './errors/auth-error'
import { ClientsRepository } from '@/domain/financial-management/application/repositories/clients-repository'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'

export interface VerifyPhoneNumberOtpUseCaseRequest {
	clientId: string
	otp: string
}

type VerifyPhoneNumberOtpUseCaseResponse = Either<
	AuthError | ClientNotFoundError,
	{
		success: true
	}
>

@Injectable()
export class VerifyPhoneNumberOtpUseCase {
	constructor(
		private usersAuthRepository: UsersAuthRepository,
		private clientsRepository: ClientsRepository,
	) {}

	async execute({
		clientId,
		otp,
	}: VerifyPhoneNumberOtpUseCaseRequest): Promise<VerifyPhoneNumberOtpUseCaseResponse> {
		const clientFound = await this.clientsRepository.findById(clientId)

		if (!clientFound) {
			return left(new ClientNotFoundError())
		}

		const targetPhoneNumber = clientFound.phoneNumber

		if (!targetPhoneNumber) {
			return left(
				new AuthError({
					errors: [{ message: 'Client phone number not found' }],
				}),
			)
		}

		const result = await this.usersAuthRepository.verifyPhoneNumberOtp(
			targetPhoneNumber,
			otp,
		)

		if (result.isLeft()) {
			return left(result.value)
		}

		return right({
			success: true,
		})
	}
}
