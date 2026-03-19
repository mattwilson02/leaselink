import { PrismaClient } from '@prisma/client'
import { betterAuth } from 'better-auth'
import { bearer, phoneNumber, twoFactor } from 'better-auth/plugins'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { hashPassword } from 'better-auth/crypto'
import {
	PASSWORD_RULES,
	validatePasswordComplexity,
} from '../password-validation'

const TEST_RESET_TOKEN = 'test-reset-token-e2e'

const isTestEmail = (email: string): boolean => {
	return /^test(\+.*)?@example\.com$/i.test(email)
}

export function createAuthInstance(prismaClient: PrismaClient) {
	const betterAuthInstance = betterAuth({
		trustedOrigins: ['http://localhost:3000', 'http://localhost:3003'],
		database: prismaAdapter(prismaClient, {
			provider: 'postgresql',
		}),
		plugins: [
			bearer(),
			phoneNumber({
				// Mock SMS sending for test/development
				sendOTP: async () => {
					// In test mode, just log and succeed without actually sending
					return
				},
			}),
			twoFactor(),
		],
		emailAndPassword: {
			enabled: true,
			minPasswordLength: PASSWORD_RULES.minLength,
			disableSignUp: false,
			resetPasswordTokenExpiresIn: 3600, // 1 hour
			password: {
				hash: async (password) => {
					validatePasswordComplexity(password)
					return hashPassword(password)
				},
			},
			sendResetPassword: async ({ user, token }) => {
				if (isTestEmail(user.email)) {
					setTimeout(async () => {
						try {
							await new Promise((resolve) => setTimeout(resolve, 100))

							const verification = await prismaClient.verification.findFirst({
								where: {
									identifier: `reset-password:${token}`,
								},
							})

							if (verification) {
								await prismaClient.verification.update({
									where: { id: verification.id },
									data: {
										identifier: `reset-password:${TEST_RESET_TOKEN}`,
									},
								})
							}
						} catch (error) {
							console.error('[TEST AUTH] Failed to replace token:', error)
						}
					}, 0)
				}
			},
		},
	})
	return betterAuthInstance as unknown as ReturnType<typeof betterAuth>
}
