import { Either, left, right } from '@/core/either'
import { UsersAuthRepository } from '@/domain/authentication/application/repositories/user-auth-repository'
import { AuthError } from '@/domain/authentication/application/use-cases/errors/auth-error'
import { UserAuth } from '@/domain/authentication/enterprise/entities/user-auth'

export class InMemoryUsersAuthRepository implements UsersAuthRepository {
	public items: UserAuth[] = []

	async create(userAuth: UserAuth): Promise<Either<AuthError, UserAuth>> {
		const existingUser = this.items.find(
			(user) => user.email === userAuth.email,
		)

		if (existingUser) {
			return left(new AuthError([{ message: 'Email already in use' }]))
		}

		this.items.push(userAuth)

		return right(userAuth)
	}

	async delete(userId: string): Promise<Either<AuthError, void>> {
		const userIndex = this.items.findIndex(
			(user) => user.id.toString() === userId,
		)

		if (userIndex === -1) {
			return left(new AuthError([{ message: 'User not found' }]))
		}

		this.items.splice(userIndex, 1)
		return right(undefined)
	}

	async sendPhoneNumberOtp(
		_phoneNumber: string,
	): Promise<Either<AuthError, void>> {
		// In a real implementation, you would send an OTP to the phone number.
		// Here, we just simulate success.
		return right(undefined)
	}

	async verifyPhoneNumberOtp(
		_phoneNumber: string,
		_otp: string,
	): Promise<Either<AuthError, void>> {
		// In a real implementation, you would verify the OTP.
		// Here, we just simulate success.
		return right(undefined)
	}

	async verifyPassword(
		userId: string,
		password: string,
	): Promise<Either<AuthError, void>> {
		const user = this.items.find((user) => user.id.toString() === userId)

		if (!user) {
			return left(
				new AuthError({
					errors: [{ message: 'User not found' }],
				}),
			)
		}

		if (user.password !== password) {
			return left(
				new AuthError({
					errors: [{ message: 'The provided password is incorrect' }],
				}),
			)
		}

		return right(undefined)
	}

	async changePassword(
		userId: string,
		currentPassword: string,
		newPassword: string,
		sessionToken: string,
	): Promise<Either<AuthError, void>> {
		if (!sessionToken) {
			return left(new AuthError([{ message: 'Invalid session token' }]))
		}

		const userIndex = this.items.findIndex(
			(user) => user.id.toString() === userId,
		)

		if (userIndex === -1) {
			return left(
				new AuthError({
					errors: [{ message: 'User not found' }],
				}),
			)
		}

		const user = this.items[userIndex]

		if (user.password !== currentPassword) {
			return left(
				new AuthError({
					errors: [{ message: 'Current password is incorrect' }],
				}),
			)
		}

		// Replace the user with a new instance that has the updated password
		const updatedUser = UserAuth.create(
			{
				email: user.email,
				name: user.name,
				phoneNumber: user.phoneNumber,
				password: newPassword,
			},
			user.id,
		)

		this.items[userIndex] = updatedUser
		return right(undefined)
	}
}
