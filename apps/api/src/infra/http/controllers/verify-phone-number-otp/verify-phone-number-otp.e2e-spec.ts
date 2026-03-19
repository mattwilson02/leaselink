import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { faker } from '@faker-js/faker'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ClientFactory } from 'test/factories/make-client'
import { createTestAppModule } from 'test/utils/test-app.module'
import { AuthService } from '@thallesp/nestjs-better-auth'
import { ClientStatus } from '@/domain/financial-management/enterprise/entities/value-objects/client-status'

const TEST_OTP = '123456'

describe('VerifyPhoneNumberOtpController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let clientFactory: ClientFactory
	let authService: AuthService

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)

		const moduleRef = await Test.createTestingModule({
			imports: [DatabaseModule, BetterAuthModule, EnvModule, testAppModule],
			providers: [ClientFactory],
		}).compile()

		app = moduleRef.createNestApplication()
		clientFactory = moduleRef.get(ClientFactory)
		authService = moduleRef.get(AuthService)
		prisma = moduleRef.get(PrismaService)

		await app.init()
	})

	afterAll(async () => {
		await app.close()
	})

	describe('Onboarding Flow (status not ACTIVE)', () => {
		it('[POST] /auth/verify-phone-number - should verify OTP for client during onboarding', async () => {
			const onboardingToken = `${crypto.randomUUID()}A1!`
			const email = faker.internet.email()
			const name = faker.person.fullName()
			const phoneNumber = '+15551234567'

			// Create user in Better Auth
			const userAuthResponse = await authService.api.signUpEmail({
				body: {
					email,
					name,
					password: onboardingToken,
				},
			})

			expect(userAuthResponse.user).toBeDefined()

			// Update phone number
			await prisma.user.update({
				where: { id: userAuthResponse.user?.id },
				data: { phoneNumber },
			})

			// Create client with INVITED status
			const client = await clientFactory.makePrismaClient({
				email,
				name,
				phoneNumber,
				onboardingToken,
				status: ClientStatus.create('INVITED'),
			})

			// Create identity provider
			await prisma.identityProvider.create({
				data: {
					providerUserId: userAuthResponse.user?.id,
					userId: client.id.toString(),
					userType: 'CLIENT',
					provider: 'BETTER_AUTH',
				},
			})

			// Sign in to get JWT
			const signInResponse = await authService.api.signInEmail({
				body: {
					email,
					password: onboardingToken,
				},
			})

			expect(signInResponse.token).toBeDefined()

			// Insert test OTP into verification table
			await prisma.verification.create({
				data: {
					id: crypto.randomUUID(),
					identifier: phoneNumber,
					value: TEST_OTP,
					expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
				},
			})

			// Verify OTP
			const response = await request(app.getHttpServer())
				.post('/auth/verify-phone-number')
				.set({
					// biome-ignore lint/style/useNamingConvention: Header
					Authorization: `Bearer ${signInResponse.token}`,
				})
				.send({
					otp: TEST_OTP,
				})
				.expect(200)

			expect(response.body).toEqual({
				success: true,
			})

			// Clean up
			await prisma.verification.deleteMany({
				where: { identifier: phoneNumber },
			})
			await prisma.identityProvider.deleteMany({
				where: { providerUserId: userAuthResponse.user?.id },
			})
			await prisma.client.delete({
				where: { id: client.id.toString() },
			})
			await prisma.session.deleteMany({
				where: { userId: userAuthResponse.user?.id },
			})
			await prisma.account.deleteMany({
				where: { userId: userAuthResponse.user?.id },
			})
			await prisma.user.delete({
				where: { id: userAuthResponse.user?.id },
			})
		})
	})

	describe('Active User Flow (status ACTIVE)', () => {
		it('[POST] /auth/verify-phone-number - should verify OTP for active user', async () => {
			const password = 'SecurePassword123!'
			const email = faker.internet.email()
			const name = faker.person.fullName()
			const phoneNumber = '+15551234570'

			// Create user in Better Auth
			const userAuthResponse = await authService.api.signUpEmail({
				body: {
					email,
					name,
					password,
				},
			})

			await prisma.user.update({
				where: { id: userAuthResponse.user?.id },
				data: { phoneNumber },
			})

			// Create ACTIVE client
			const client = await clientFactory.makePrismaClient({
				email,
				name,
				phoneNumber,
				status: ClientStatus.create('ACTIVE'),
			})

			await prisma.identityProvider.create({
				data: {
					providerUserId: userAuthResponse.user?.id,
					userId: client.id.toString(),
					userType: 'CLIENT',
					provider: 'BETTER_AUTH',
				},
			})

			const signInResponse = await authService.api.signInEmail({
				body: {
					email,
					password,
				},
			})

			// Insert test OTP into verification table
			await prisma.verification.create({
				data: {
					id: crypto.randomUUID(),
					identifier: phoneNumber,
					value: TEST_OTP,
					expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
				},
			})

			// Verify OTP
			const response = await request(app.getHttpServer())
				.post('/auth/verify-phone-number')
				.set({
					// biome-ignore lint/style/useNamingConvention: Header
					Authorization: `Bearer ${signInResponse.token}`,
				})
				.send({
					otp: TEST_OTP,
				})
				.expect(200)

			expect(response.body).toEqual({
				success: true,
			})

			// Clean up
			await prisma.verification.deleteMany({
				where: { identifier: phoneNumber },
			})
			await prisma.identityProvider.deleteMany({
				where: { providerUserId: userAuthResponse.user?.id },
			})
			await prisma.client.delete({
				where: { id: client.id.toString() },
			})
			await prisma.session.deleteMany({
				where: { userId: userAuthResponse.user?.id },
			})
			await prisma.account.deleteMany({
				where: { userId: userAuthResponse.user?.id },
			})
			await prisma.user.delete({
				where: { id: userAuthResponse.user?.id },
			})
		})

		it('[POST] /auth/verify-phone-number - should fail with invalid OTP', async () => {
			const password = 'SecurePassword123!'
			const email = faker.internet.email()
			const name = faker.person.fullName()
			const phoneNumber = '+15551234571'

			// Create user in Better Auth
			const userAuthResponse = await authService.api.signUpEmail({
				body: {
					email,
					name,
					password,
				},
			})

			await prisma.user.update({
				where: { id: userAuthResponse.user?.id },
				data: { phoneNumber },
			})

			// Create ACTIVE client
			const client = await clientFactory.makePrismaClient({
				email,
				name,
				phoneNumber,
				status: ClientStatus.create('ACTIVE'),
			})

			await prisma.identityProvider.create({
				data: {
					providerUserId: userAuthResponse.user?.id,
					userId: client.id.toString(),
					userType: 'CLIENT',
					provider: 'BETTER_AUTH',
				},
			})

			const signInResponse = await authService.api.signInEmail({
				body: {
					email,
					password,
				},
			})

			// Insert test OTP into verification table
			await prisma.verification.create({
				data: {
					id: crypto.randomUUID(),
					identifier: phoneNumber,
					value: TEST_OTP,
					expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
				},
			})

			// Try to verify with wrong OTP
			await request(app.getHttpServer())
				.post('/auth/verify-phone-number')
				.set({
					// biome-ignore lint/style/useNamingConvention: Header
					Authorization: `Bearer ${signInResponse.token}`,
				})
				.send({
					otp: '000000', // Wrong OTP
				})
				.expect(400)

			// Clean up
			await prisma.verification.deleteMany({
				where: { identifier: phoneNumber },
			})
			await prisma.identityProvider.deleteMany({
				where: { providerUserId: userAuthResponse.user?.id },
			})
			await prisma.client.delete({
				where: { id: client.id.toString() },
			})
			await prisma.session.deleteMany({
				where: { userId: userAuthResponse.user?.id },
			})
			await prisma.account.deleteMany({
				where: { userId: userAuthResponse.user?.id },
			})
			await prisma.user.delete({
				where: { id: userAuthResponse.user?.id },
			})
		})
	})

	describe('Error Cases', () => {
		it('[POST] /auth/verify-phone-number - should fail if client not found', async () => {
			const password = 'SecurePassword123!'
			const email = faker.internet.email()
			const name = faker.person.fullName()
			const phoneNumber = '+15551234573'

			// Create user in Better Auth but no client
			const userAuthResponse = await authService.api.signUpEmail({
				body: {
					email,
					name,
					password,
				},
			})

			await prisma.user.update({
				where: { id: userAuthResponse.user?.id },
				data: { phoneNumber },
			})

			const signInResponse = await authService.api.signInEmail({
				body: {
					email,
					password,
				},
			})

			// Should fail at auth guard level because there's no client associated
			await request(app.getHttpServer())
				.post('/auth/verify-phone-number')
				.set({
					// biome-ignore lint/style/useNamingConvention: Header
					Authorization: `Bearer ${signInResponse.token}`,
				})
				.send({
					otp: TEST_OTP,
				})
				.expect(401)

			// Clean up
			await prisma.session.deleteMany({
				where: { userId: userAuthResponse.user?.id },
			})
			await prisma.account.deleteMany({
				where: { userId: userAuthResponse.user?.id },
			})
			await prisma.user.delete({
				where: { id: userAuthResponse.user?.id },
			})
		})

		it('[POST] /auth/verify-phone-number - should fail without authentication', async () => {
			await request(app.getHttpServer())
				.post('/auth/verify-phone-number')
				.send({
					otp: TEST_OTP,
				})
				.expect(401)
		})

		it('[POST] /auth/verify-phone-number - should fail with invalid OTP format', async () => {
			const password = 'SecurePassword123!'
			const email = faker.internet.email()
			const name = faker.person.fullName()
			const phoneNumber = '+15551234572'

			// Create user in Better Auth
			const userAuthResponse = await authService.api.signUpEmail({
				body: {
					email,
					name,
					password,
				},
			})

			await prisma.user.update({
				where: { id: userAuthResponse.user?.id },
				data: { phoneNumber },
			})

			// Create ACTIVE client
			const client = await clientFactory.makePrismaClient({
				email,
				name,
				phoneNumber,
				status: ClientStatus.create('ACTIVE'),
			})

			await prisma.identityProvider.create({
				data: {
					providerUserId: userAuthResponse.user?.id,
					userId: client.id.toString(),
					userType: 'CLIENT',
					provider: 'BETTER_AUTH',
				},
			})

			const signInResponse = await authService.api.signInEmail({
				body: {
					email,
					password,
				},
			})

			// Try to verify with invalid OTP format
			await request(app.getHttpServer())
				.post('/auth/verify-phone-number')
				.set({
					// biome-ignore lint/style/useNamingConvention: Header
					Authorization: `Bearer ${signInResponse.token}`,
				})
				.send({
					otp: '12345', // Only 5 digits
				})
				.expect(400)

			// Clean up
			await prisma.identityProvider.deleteMany({
				where: { providerUserId: userAuthResponse.user?.id },
			})
			await prisma.client.delete({
				where: { id: client.id.toString() },
			})
			await prisma.session.deleteMany({
				where: { userId: userAuthResponse.user?.id },
			})
			await prisma.account.deleteMany({
				where: { userId: userAuthResponse.user?.id },
			})
			await prisma.user.delete({
				where: { id: userAuthResponse.user?.id },
			})
		})
	})
})
