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

describe('SendClientPhoneOtpController (E2E)', () => {
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
		it('[POST] /auth/client/send-phone-otp - should send OTP when phone number matches during onboarding', async () => {
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

			// Create client with PENDING status
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

			// Send OTP with matching phone number
			const response = await request(app.getHttpServer())
				.post('/auth/client/send-phone-otp')
				.set({
					// biome-ignore lint/style/useNamingConvention: Header
					Authorization: `Bearer ${signInResponse.token}`,
				})
				.send({
					phoneNumber,
				})
				.expect(200)

			expect(response.body).toEqual({ success: true })

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

		it('[POST] /auth/client/send-phone-otp - should fail when phone number not provided during onboarding', async () => {
			const onboardingToken = `${crypto.randomUUID()}A1!`
			const email = faker.internet.email()
			const name = faker.person.fullName()
			const phoneNumber = '+15551234568'

			// Create user in Better Auth
			const userAuthResponse = await authService.api.signUpEmail({
				body: {
					email,
					name,
					password: onboardingToken,
				},
			})

			await prisma.user.update({
				where: { id: userAuthResponse.user?.id },
				data: { phoneNumber },
			})

			// Create client with PENDING status
			const client = await clientFactory.makePrismaClient({
				email,
				name,
				phoneNumber,
				onboardingToken,
				status: ClientStatus.create('INVITED'),
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
					password: onboardingToken,
				},
			})

			// Send OTP without phone number
			await request(app.getHttpServer())
				.post('/auth/client/send-phone-otp')
				.set({
					// biome-ignore lint/style/useNamingConvention: Header
					Authorization: `Bearer ${signInResponse.token}`,
				})
				.send({})
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

		it('[POST] /auth/client/send-phone-otp - should fail when phone number does not match during onboarding', async () => {
			const onboardingToken = `${crypto.randomUUID()}A1!`
			const email = faker.internet.email()
			const name = faker.person.fullName()
			const phoneNumber = '+15551234569'

			// Create user in Better Auth
			const userAuthResponse = await authService.api.signUpEmail({
				body: {
					email,
					name,
					password: onboardingToken,
				},
			})

			await prisma.user.update({
				where: { id: userAuthResponse.user?.id },
				data: { phoneNumber },
			})

			// Create client with PENDING status
			const client = await clientFactory.makePrismaClient({
				email,
				name,
				phoneNumber,
				onboardingToken,
				status: ClientStatus.create('INVITED'),
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
					password: onboardingToken,
				},
			})

			// Send OTP with wrong phone number
			await request(app.getHttpServer())
				.post('/auth/client/send-phone-otp')
				.set({
					// biome-ignore lint/style/useNamingConvention: Header
					Authorization: `Bearer ${signInResponse.token}`,
				})
				.send({
					phoneNumber: '+15559999999', // Wrong number
				})
				.expect(422)

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

	describe('Active User Flow (status ACTIVE)', () => {
		it('[POST] /auth/client/send-phone-otp - should send OTP without phone number for active user', async () => {
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

			// Send OTP without providing phone number (should use from database)
			const response = await request(app.getHttpServer())
				.post('/auth/client/send-phone-otp')
				.set({
					// biome-ignore lint/style/useNamingConvention: Header
					Authorization: `Bearer ${signInResponse.token}`,
				})
				.send({})
				.expect(200)

			expect(response.body).toEqual({ success: true })

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

		it('[POST] /auth/client/send-phone-otp - should send OTP when phone number matches for active user', async () => {
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

			// Send OTP with matching phone number
			const response = await request(app.getHttpServer())
				.post('/auth/client/send-phone-otp')
				.set({
					// biome-ignore lint/style/useNamingConvention: Header
					Authorization: `Bearer ${signInResponse.token}`,
				})
				.send({
					phoneNumber,
				})
				.expect(200)

			expect(response.body).toEqual({ success: true })

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

		it('[POST] /auth/client/send-phone-otp - should fail when provided phone number does not match for active user', async () => {
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

			// Send OTP with wrong phone number
			await request(app.getHttpServer())
				.post('/auth/client/send-phone-otp')
				.set({
					// biome-ignore lint/style/useNamingConvention: Header
					Authorization: `Bearer ${signInResponse.token}`,
				})
				.send({
					phoneNumber: '+15559999999', // Wrong number
				})
				.expect(422)

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

	describe('Authentication', () => {
		it('[POST] /auth/client/send-phone-otp - should fail without authentication', async () => {
			await request(app.getHttpServer())
				.post('/auth/client/send-phone-otp')
				.send({
					phoneNumber: '+15551234567',
				})
				.expect(401)
		})
	})
})
