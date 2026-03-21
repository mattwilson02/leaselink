import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { faker } from '@faker-js/faker'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { createTestAppModule } from 'test/utils/test-app.module'
import { AuthService } from '@thallesp/nestjs-better-auth'

describe('GetSessionsController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let authService: AuthService

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)

		const moduleRef = await Test.createTestingModule({
			imports: [DatabaseModule, BetterAuthModule, EnvModule, testAppModule],
		}).compile()

		app = moduleRef.createNestApplication()
		authService = moduleRef.get(AuthService)
		prisma = moduleRef.get(PrismaService)

		await app.init()
	})

	it('[GET] /sessions - returns active sessions for authenticated user', async () => {
		const password = `${crypto.randomUUID()}A1!`
		const email = faker.internet.email()
		const name = faker.person.fullName()

		const userAuthResponse = await authService.api.signUpEmail({
			body: { email, name, password },
		})

		expect(userAuthResponse.user).toBeDefined()

		const signInResponse = await authService.api.signInEmail({
			body: { email, password },
		})

		expect(signInResponse.token).toBeDefined()
		const jwt = signInResponse.token

		const response = await request(app.getHttpServer())
			.get('/sessions')
			.set({
				// biome-ignore lint/style/useNamingConvention: header casing
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body).toHaveProperty('sessions')
		expect(Array.isArray(response.body.sessions)).toBe(true)
		expect(response.body.sessions.length).toBeGreaterThan(0)

		const currentSession = response.body.sessions.find(
			(s: { isCurrent: boolean }) => s.isCurrent === true,
		)
		expect(currentSession).toBeDefined()
		expect(currentSession).toEqual(
			expect.objectContaining({
				id: expect.any(String),
				createdAt: expect.any(String),
				isCurrent: true,
			}),
		)

		// token must not be returned
		expect(currentSession.token).toBeUndefined()

		// Clean up
		await prisma.session.deleteMany({
			where: { userId: userAuthResponse.user?.id },
		})
		await prisma.account.deleteMany({
			where: { userId: userAuthResponse.user?.id },
		})
		await prisma.user.delete({ where: { id: userAuthResponse.user?.id } })
	})

	it('[GET] /sessions - excludes expired sessions', async () => {
		const password = `${crypto.randomUUID()}A1!`
		const email = faker.internet.email()
		const name = faker.person.fullName()

		const userAuthResponse = await authService.api.signUpEmail({
			body: { email, name, password },
		})

		expect(userAuthResponse.user).toBeDefined()

		// Insert an expired session directly
		await prisma.session.create({
			data: {
				id: `expired-${crypto.randomUUID()}`,
				token: `expired-token-${crypto.randomUUID()}`,
				userId: userAuthResponse.user?.id,
				expiresAt: new Date(Date.now() - 1000), // already expired
				createdAt: new Date(Date.now() - 5000),
				updatedAt: new Date(Date.now() - 5000),
			},
		})

		const signInResponse = await authService.api.signInEmail({
			body: { email, password },
		})

		expect(signInResponse.token).toBeDefined()
		const jwt = signInResponse.token

		const response = await request(app.getHttpServer())
			.get('/sessions')
			.set({
				// biome-ignore lint/style/useNamingConvention: header casing
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		// All returned sessions should not be expired
		for (const session of response.body.sessions) {
			expect(new Date(session.createdAt).getTime()).toBeLessThanOrEqual(
				Date.now(),
			)
		}

		// No expired session token in results
		const expiredInResults = response.body.sessions.some((s: { id: string }) =>
			s.id.startsWith('expired-'),
		)
		expect(expiredInResults).toBe(false)

		// Clean up
		await prisma.session.deleteMany({
			where: { userId: userAuthResponse.user?.id },
		})
		await prisma.account.deleteMany({
			where: { userId: userAuthResponse.user?.id },
		})
		await prisma.user.delete({ where: { id: userAuthResponse.user?.id } })
	})

	it('[GET] /sessions - returns 401 when not authenticated', async () => {
		await request(app.getHttpServer()).get('/sessions').expect(401)
	})

	it('[GET] /sessions - does not return sessions of other users', async () => {
		const password = `${crypto.randomUUID()}A1!`
		const email1 = faker.internet.email()
		const email2 = faker.internet.email()
		const name = faker.person.fullName()

		const user1 = await authService.api.signUpEmail({
			body: { email: email1, name, password },
		})
		const user2 = await authService.api.signUpEmail({
			body: { email: email2, name, password },
		})

		expect(user1.user).toBeDefined()
		expect(user2.user).toBeDefined()

		const signIn1 = await authService.api.signInEmail({
			body: { email: email1, password },
		})

		const response = await request(app.getHttpServer())
			.get('/sessions')
			.set({
				// biome-ignore lint/style/useNamingConvention: header casing
				Authorization: `Bearer ${signIn1.token}`,
			})
			.expect(200)

		// All sessions belong to user1's authUserId
		const sessionIds = await prisma.session.findMany({
			where: { userId: user2.user?.id },
		})
		const user2SessionIds = sessionIds.map((s) => s.id)

		for (const session of response.body.sessions) {
			expect(user2SessionIds).not.toContain(session.id)
		}

		// Clean up
		await prisma.session.deleteMany({ where: { userId: user1.user?.id } })
		await prisma.account.deleteMany({ where: { userId: user1.user?.id } })
		await prisma.user.delete({ where: { id: user1.user?.id } })

		await prisma.session.deleteMany({ where: { userId: user2.user?.id } })
		await prisma.account.deleteMany({ where: { userId: user2.user?.id } })
		await prisma.user.delete({ where: { id: user2.user?.id } })
	})
})
