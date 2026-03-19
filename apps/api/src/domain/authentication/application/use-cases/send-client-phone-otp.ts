import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersAuthRepository } from '../repositories/user-auth-repository'
import { ClientsRepository } from '@/domain/financial-management/application/repositories/clients-repository'
import { ClientNotFoundError } from '@/domain/financial-management/application/use-cases/errors/client-not-found-error'
import { PhoneNumberMismatchError } from '@/domain/authentication/application/use-cases/errors/phone-number-mismatch-error'
import { AuthError } from './errors/auth-error'

export interface SendClientPhoneOtpUseCaseRequest {
	phoneNumber?: string
	clientId: string
}

type SendClientPhoneOtpUseCaseResponse = Either<
	PhoneNumberMismatchError | ClientNotFoundError | AuthError,
	{
		success: true
	}
>

@Injectable()
export class SendClientPhoneOtpUseCase {
	constructor(
		private usersAuthRepository: UsersAuthRepository,
		private clientsRepository: ClientsRepository,
	) {}

	async execute({
		phoneNumber,
		clientId,
	}: SendClientPhoneOtpUseCaseRequest): Promise<SendClientPhoneOtpUseCaseResponse> {
		const clientFound = await this.clientsRepository.findById(clientId)

		if (!clientFound) {
			return left(new ClientNotFoundError())
		}

		let targetPhoneNumber: string

		if (clientFound.status !== 'ACTIVE') {
			// Onboarding flow: phone number must be provided and validated
			if (!phoneNumber) {
				return left(
					new AuthError({
						errors: [
							{
								message:
									'Phone number is required during onboarding verification',
							},
						],
					}),
				)
			}

			if (phoneNumber !== clientFound.phoneNumber) {
				return left(new PhoneNumberMismatchError())
			}

			targetPhoneNumber = phoneNumber
		} else {
			// Active user / new device flow: use phone from database
			targetPhoneNumber = clientFound.phoneNumber

			// Optional: if they provided a phone number, validate it matches
			if (phoneNumber && phoneNumber !== clientFound.phoneNumber) {
				return left(new PhoneNumberMismatchError())
			}
		}

		const result =
			await this.usersAuthRepository.sendPhoneNumberOtp(targetPhoneNumber)

		if (result.isLeft()) {
			return left(result.value)
		}

		return right({
			success: true,
		})
	}
}
