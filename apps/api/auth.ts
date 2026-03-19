import { PrismaClient } from '@prisma/client'
import { betterAuth } from 'better-auth'
import { bearer, emailOTP, phoneNumber, twoFactor } from 'better-auth/plugins'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { hashPassword } from 'better-auth/crypto'
import { Twilio } from 'twilio'
import * as nodemailer from 'nodemailer'
import {
	getPasswordResetConfirmationEmailTemplate,
	getPasswordResetEmailTemplate,
	getVerificationOTPEmailTemplate,
} from './src/infra/auth/email-templates'
import {
	PASSWORD_RULES,
	validatePasswordComplexity,
} from './src/infra/auth/password-validation'
import { randomUUID } from 'node:crypto'

const prisma = new PrismaClient()

const twilioClient = new Twilio(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN,
)

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number.parseInt(process.env.SMTP_PORT || '587'),
	secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASSWORD,
	},
})

// Verify SMTP connection on startup
transporter.verify((error) => {
	if (error) {
		console.error('SMTP connection error:', error)
	}
})

const TEST_OTP = '123456'
const TEST_RESET_TOKEN = 'test-reset-token-e2e'

const IS_TEST_MODE = process.env.NODE_ENV === 'development'

// Helper functions to identify test accounts
const isTestEmail = (email: string): boolean => {
	return /^test(\+.*)?@example\.com$/i.test(email)
}

const isTestPhone = (phone: string): boolean => {
	return /^\+1555\d{7}$/.test(phone)
}

export const auth = betterAuth({
	trustedOrigins: [
		'http://localhost:3000',
		'http://localhost:3003',
		'leaselink://(forgot-password)/reset-password',
		'leaselink://',
	],
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),
	socialProviders: {
		microsoft: {
			clientId: process.env.AZURE_AD_CLIENT_ID || '',
			clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
			redirectURI: 'http://localhost:3333/api/auth/callback/microsoft',
			tenant: process.env.AZURE_AD_TENANT_ID,
			authority: 'https://login.microsoftonline.com', // Authentication authority URL
			prompt: 'select_account', // Forces account selection
		},
	},
	plugins: [
		bearer(),
		twoFactor(),
		emailOTP({
			async sendVerificationOTP({ email, otp, type }) {
				if (isTestEmail(email) && IS_TEST_MODE) {
					otp = TEST_OTP
					await prisma.verification.deleteMany({
						where: {
							identifier: `sign-in-otp-${email}`,
						},
					})

					await prisma.verification.create({
						data: {
							id: randomUUID(),
							identifier: `sign-in-otp-${email}`,
							value: `${TEST_OTP}:0`,
							expiresAt: new Date(Date.now() + 300000),
						},
					})

					return
				}

				try {
					const { subject, htmlContent, textContent } =
						getVerificationOTPEmailTemplate({ otp, type })

					await transporter.sendMail({
						from: `"${process.env.SMTP_FROM_NAME || 'Stonehage Fleming'}" <${process.env.SMTP_USER}>`,
						to: email,
						subject,
						text: textContent,
						html: htmlContent,
					})
				} catch (error) {
					console.error('Failed to send verification OTP:', error)
					throw new Error('Failed to send verification email')
				}
			},
		}),
		phoneNumber({
			sendOTP: async ({ phoneNumber: phone, code }) => {
				if (isTestPhone(phone) && IS_TEST_MODE) {
					code = TEST_OTP

					await prisma.verification.deleteMany({
						where: {
							identifier: phone,
						},
					})
					await prisma.verification.create({
						data: {
							id: randomUUID(),
							identifier: phone,
							value: `${TEST_OTP}:0`,
							expiresAt: new Date(Date.now() + 300000),
						},
					})

					return
				}

				try {
					await twilioClient.messages.create({
						body: `Your verification code is: ${code}`,
						from: process.env.TWILIO_PHONE_NUMBER,
						to: phone,
					})
				} catch (error) {
					console.error('Failed to send OTP:', error)
					throw new Error('Failed to send verification code')
				}
			},
			otpLength: 6,
			expiresIn: 300,
		}),
	],
	emailAndPassword: {
		enabled: true,
		minPasswordLength: PASSWORD_RULES.minLength,
		resetPasswordTokenExpiresIn: 3600, // 1 hour
		disableSignUp: false,
		password: {
			hash: async (password) => {
				validatePasswordComplexity(password)
				return hashPassword(password)
			},
		},
		sendResetPassword: async ({ user, url, token }) => {
			if (isTestEmail(user.email) && IS_TEST_MODE) {
				setTimeout(async () => {
					try {
						await new Promise((resolve) => setTimeout(resolve, 100))

						const verification = await prisma.verification.findFirst({
							where: {
								identifier: `reset-password:${token}`,
							},
						})

						if (verification) {
							await prisma.verification.update({
								where: { id: verification.id },
								data: {
									identifier: `reset-password:${TEST_RESET_TOKEN}`,
								},
							})
						}
					} catch (error) {
						console.error('[TEST MODE] Failed to replace token:', error)
					}
				}, 0)

				return
			}

			try {
				const { subject, htmlContent, textContent } =
					getPasswordResetEmailTemplate({ url })

				await transporter.sendMail({
					from: `"${process.env.SMTP_FROM_NAME || 'Stonehage Fleming'}" <${process.env.SMTP_USER}>`,
					to: user.email,
					subject,
					text: textContent,
					html: htmlContent,
				})
			} catch (error) {
				console.error('Failed to send password reset email:', error)
				throw new Error('Failed to send password reset email')
			}
		},
		onPasswordReset: async ({ user }) => {
			// Test mode: skip confirmation email
			if (isTestEmail(user.email) && IS_TEST_MODE) {
				return
			}

			try {
				const { subject, htmlContent, textContent } =
					getPasswordResetConfirmationEmailTemplate()

				await transporter.sendMail({
					from: `"${process.env.SMTP_FROM_NAME || 'Stonehage Fleming'}" <${process.env.SMTP_USER}>`,
					to: user.email,
					subject,
					text: textContent,
					html: htmlContent,
				})
			} catch (error) {
				console.error('Failed to send password reset confirmation:', error)
			}
		},
	},
})

export type Auth = typeof auth
