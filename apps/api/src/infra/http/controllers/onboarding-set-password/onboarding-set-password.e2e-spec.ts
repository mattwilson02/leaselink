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

describe('OnboardingSetPasswordController (E2E)', () => {
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

	it('[POST] /auth/onboarding/set-password', async () => {
		const onboardingToken = `${crypto.randomUUID()}A1!`
		const email = faker.internet.email()
		const name = faker.person.fullName()
		const phoneNumber = '1-602-392-7541'

		// Create user in Better Auth with onboarding token as password
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

		// Create client with onboarding token
		const client = await clientFactory.makePrismaClient({
			email,
			name,
			phoneNumber,
			onboardingToken,
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

		// Sign in with onboarding token to get JWT
		const signInResponse = await authService.api.signInEmail({
			body: {
				email,
				password: onboardingToken,
			},
		})

		expect(signInResponse.token).toBeDefined()

		const jwt = signInResponse.token

		// Now call the set password endpoint
		const newPassword = 'MyNewSecurePassword123!'
		const response = await request(app.getHttpServer())
			.post('/auth/onboarding/set-password')
			.set({
				// biome-ignore lint/style/useNamingConvention: <explanation>
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				newPassword,
			})
			.expect(200)

		expect(response.body).toEqual({ success: true })

		// Verify the client's onboarding status was updated and token was cleared
		const updatedClient = await prisma.client.findUnique({
			where: { id: client.id.toString() },
		})

		expect(updatedClient?.onboardingStatus).toBe('PASSWORD_SET')
		expect(updatedClient?.onboardingToken).toBe(null)

		// Verify we can now sign in with the new password
		const newSignInResponse = await authService.api.signInEmail({
			body: {
				email,
				password: newPassword,
			},
		})

		expect(newSignInResponse.token).toBeDefined()
		expect(newSignInResponse.user).toBeDefined()

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

	it('[POST] /auth/onboarding/set-password - should fail with invalid password', async () => {
		const onboardingToken = `${crypto.randomUUID()}A1!`
		const email = faker.internet.email()
		const name = faker.person.fullName()
		const phoneNumber = '1-602-392-7542'

		// Create user in Better Auth with onboarding token as password
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

		// Create client with onboarding token
		const client = await clientFactory.makePrismaClient({
			email,
			name,
			phoneNumber,
			onboardingToken,
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

		// Sign in with onboarding token to get JWT
		const signInResponse = await authService.api.signInEmail({
			body: {
				email,
				password: onboardingToken,
			},
		})

		expect(signInResponse.token).toBeDefined()

		const jwt = signInResponse.token

		// Try to set a password that's too short
		await request(app.getHttpServer())
			.post('/auth/onboarding/set-password')
			.set({
				// biome-ignore lint/style/useNamingConvention: <explanation>
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				newPassword: 'short',
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

	it('[POST] /auth/onboarding/set-password - should fail without authentication', async () => {
		await request(app.getHttpServer())
			.post('/auth/onboarding/set-password')
			.send({
				newPassword: 'MyNewSecurePassword123!',
			})
			.expect(401)
	})
})
