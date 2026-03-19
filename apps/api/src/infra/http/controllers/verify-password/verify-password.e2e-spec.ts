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

describe('VerifyPasswordController (E2E)', () => {
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

	it('[POST] /auth/verify-password - should verify correct password', async () => {
		const password = `${crypto.randomUUID()}A1!`
		const email = faker.internet.email()
		const name = faker.person.fullName()
		const phoneNumber = '1-602-392-7550'

		// Create user in Better Auth
		const userAuthResponse = await authService.api.signUpEmail({
			body: {
				email,
				name,
				password,
			},
		})

		expect(userAuthResponse.user).toBeDefined()

		// Update phone number
		await prisma.user.update({
			where: { id: userAuthResponse.user?.id },
			data: { phoneNumber },
		})

		// Create client
		const client = await clientFactory.makePrismaClient({
			email,
			name,
			phoneNumber,
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
				password,
			},
		})

		expect(signInResponse.token).toBeDefined()

		const jwt = signInResponse.token

		// Verify with correct password
		const response = await request(app.getHttpServer())
			.post('/auth/verify-password')
			.set({
				// biome-ignore lint/style/useNamingConvention: <explanation>
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				password,
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

	it('[POST] /auth/verify-password - should fail with incorrect password', async () => {
		const password = `${crypto.randomUUID()}A1!`
		const email = faker.internet.email()
		const name = faker.person.fullName()
		const phoneNumber = '1-602-392-7551'

		// Create user in Better Auth
		const userAuthResponse = await authService.api.signUpEmail({
			body: {
				email,
				name,
				password,
			},
		})

		expect(userAuthResponse.user).toBeDefined()

		// Update phone number
		await prisma.user.update({
			where: { id: userAuthResponse.user?.id },
			data: { phoneNumber },
		})

		// Create client
		const client = await clientFactory.makePrismaClient({
			email,
			name,
			phoneNumber,
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
				password,
			},
		})

		expect(signInResponse.token).toBeDefined()

		const jwt = signInResponse.token

		// Verify with wrong password
		await request(app.getHttpServer())
			.post('/auth/verify-password')
			.set({
				// biome-ignore lint/style/useNamingConvention: <explanation>
				Authorization: `Bearer ${jwt}`,
			})
			.send({
				password: 'WrongPassword456!',
			})
			.expect(401)

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

	it('[POST] /auth/verify-password - should fail without authentication', async () => {
		await request(app.getHttpServer())
			.post('/auth/verify-password')
			.send({
				password: 'AnyPassword123!',
			})
			.expect(401)
	})
})
