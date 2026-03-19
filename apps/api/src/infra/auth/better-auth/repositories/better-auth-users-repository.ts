import { Either, left, right } from '@/core/either'
import { UsersAuthRepository } from '@/domain/authentication/application/repositories/user-auth-repository'
import { AuthError } from '@/domain/authentication/application/use-cases/errors/auth-error'
import { UserAuth } from '@/domain/authentication/enterprise/entities/user-auth'
import { Injectable } from '@nestjs/common'
import { verifyPassword as verifyPasswordHash } from 'better-auth/crypto'
import { BetterAuthUserMapper } from '../mappers/better-auth-user-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AuthService } from '@thallesp/nestjs-better-auth'
import { Auth } from 'auth'

@Injectable()
export class BetterAuthUsersRepository implements UsersAuthRepository {
	constructor(
		private betterAuthService: AuthService<Auth>,
		private prisma: PrismaService,
	) {}

	async create(userAuth: UserAuth): Promise<Either<AuthError, UserAuth>> {
		try {
			if (!userAuth.password) {
				throw new Error('Password is required for user creation')
			}

			const response = await this.betterAuthService.api.signUpEmail({
				body: {
					email: userAuth.email,
					name: userAuth.name,
					password: userAuth.password,
				},
			})

			if (!response.user) {
				throw new Error('User creation failed')
			}

			const phoneResponse = await this.prisma.user.update({
				where: { id: response.user.id },
				data: {
					phoneNumber: userAuth.phoneNumber,
				},
			})

			if (!phoneResponse) {
				throw new Error('Phone number update failed')
			}

			const userWithPhoneNumbers = {
				...response.user,
				phoneNumber: userAuth.phoneNumber,
			}

			const domainUser = BetterAuthUserMapper.toDomain(userWithPhoneNumbers)

			return right(domainUser)
		} catch (error) {
			return left(this.handleError(error))
		}
	}

	// TODO: this may not work, needs testing + remove account, sessions etc.
	async delete(userId: string): Promise<Either<AuthError, void>> {
		try {
			const response = await this.prisma.user.delete({
				where: { id: userId },
			})

			if (response) {
				return right(undefined)
			}

			return left(new Error('User deletion failed') as AuthError)
		} catch (error) {
			return left(this.handleError(error))
		}
	}

	async sendPhoneNumberOtp(
		phoneNumber: string,
	): Promise<Either<AuthError, void>> {
		try {
			await this.betterAuthService.api.sendPhoneNumberOTP({
				body: {
					phoneNumber,
				},
			})

			return right(undefined)
		} catch (error) {
			return left(this.handleError(error))
		}
	}

	async verifyPhoneNumberOtp(
		phoneNumber: string,
		otp: string,
	): Promise<Either<AuthError, void>> {
		try {
			await this.betterAuthService.api.verifyPhoneNumber({
				body: {
					phoneNumber,
					code: otp,
					disableSession: false,
				},
			})

			return right(undefined)
		} catch (error) {
			return left(this.handleError(error))
		}
	}

	async changePassword(
		userId: string,
		currentPassword: string,
		newPassword: string,
		sessionToken: string,
	): Promise<Either<AuthError, void>> {
		try {
			const user = await this.prisma.user.findUnique({
				where: { id: userId },
			})

			if (!user) {
				return left(
					new AuthError({
						errors: [{ message: 'User not found' }],
					}),
				)
			}

			const response = await this.betterAuthService.api.changePassword({
				body: {
					currentPassword,
					newPassword,
					revokeOtherSessions: false,
				},
				headers: new Headers({
					authorization: `Bearer ${sessionToken}`,
				}),
			})

			if (!response) {
				return left(
					new AuthError({
						errors: [{ message: 'Password change failed' }],
					}),
				)
			}

			return right(undefined)
		} catch (error) {
			return left(this.handleError(error))
		}
	}

	async verifyPassword(
		userId: string,
		password: string,
	): Promise<Either<AuthError, void>> {
		try {
			const account = await this.prisma.account.findFirst({
				where: {
					userId,
					providerId: 'credential',
				},
			})

			if (!account || !account.password) {
				return left(
					new AuthError({
						errors: [{ message: 'Account not found or no password set' }],
					}),
				)
			}

			const isValid = await verifyPasswordHash({
				hash: account.password,
				password,
			})

			if (!isValid) {
				return left(
					new AuthError({
						errors: [{ message: 'The provided password is incorrect' }],
					}),
				)
			}

			return right(undefined)
		} catch (error) {
			return left(this.handleError(error))
		}
	}

	private handleError(error: unknown): AuthError {
		if (
			error &&
			typeof error === 'object' &&
			'errors' in error &&
			Array.isArray((error as { errors: unknown[] }).errors)
		) {
			return new AuthError(error)
		}

		return new AuthError({
			errors: [{ message: 'Unexpected error while creating a user' }],
		})
	}
}
