import type { Either } from '@/core/either'
import type { UserAuth } from '@/domain/authentication/enterprise/entities/user-auth'
import type { AuthError } from '../use-cases/errors/auth-error'

export abstract class UsersAuthRepository {
	abstract create(userAuth: UserAuth): Promise<Either<AuthError, UserAuth>>
	abstract delete(userId: string): Promise<Either<AuthError, void>>
	abstract sendPhoneNumberOtp(
		phoneNumber: string,
	): Promise<Either<AuthError, void>>
	abstract verifyPhoneNumberOtp(
		phoneNumber: string,
		otp: string,
	): Promise<Either<AuthError, void>>
	abstract changePassword(
		userId: string,
		currentPassword: string,
		newPassword: string,
		sessionToken: string,
	): Promise<Either<AuthError, void>>
	abstract verifyPassword(
		userId: string,
		password: string,
	): Promise<Either<AuthError, void>>
}
