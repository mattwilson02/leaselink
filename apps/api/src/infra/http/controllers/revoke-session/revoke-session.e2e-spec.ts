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

describe('RevokeSessionController (E2E)', () => {
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

	it('[DELETE] /sessions/:id - returns 204 when revoking another session', async () => {
		const password = `${crypto.randomUUID()}A1!`
		const email = faker.internet.email()
		const name = faker.person.fullName()

		const userAuthResponse = await authService.api.signUpEmail({
			body: { email, name, password },
		})

		expect(userAuthResponse.user).toBeDefined()

		// Sign in twice to get two sessions
		const session1 = await authService.api.signInEmail({
			body: { email, password },
		})
		const session2 = await authService.api.signInEmail({
			body: { email, password },
		})

		expect(session1.token).toBeDefined()
		expect(session2.token).toBeDefined()

		// Get the session IDs from the DB
		const dbSessions = await prisma.session.findMany({
			where: {
				userId: userAuthResponse.user!.id,
				expiresAt: { gt: new Date() },
			},
		})

		// Find the session that corresponds to session1 token (to revoke using session2 JWT)
		const sessionToRevoke = dbSessions.find((s) => s.token === session1.token)
		expect(sessionToRevoke).toBeDefined()

		// Use session2 to revoke session1
		await request(app.getHttpServer())
			.delete(`/sessions/${sessionToRevoke!.id}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: header casing
				Authorization: `Bearer ${session2.token}`,
			})
			.expect(204)

		// Verify it's gone
		const deleted = await prisma.session.findUnique({
			where: { id: sessionToRevoke!.id },
		})
		expect(deleted).toBeNull()

		// Clean up
		await prisma.session.deleteMany({
			where: { userId: userAuthResponse.user?.id },
		})
		await prisma.account.deleteMany({
			where: { userId: userAuthResponse.user?.id },
		})
		await prisma.user.delete({ where: { id: userAuthResponse.user?.id } })
	})

	it('[DELETE] /sessions/:id - returns 400 when revoking current session', async () => {
		const password = `${crypto.randomUUID()}A1!`
		const email = faker.internet.email()
		const name = faker.person.fullName()

		const userAuthResponse = await authService.api.signUpEmail({
			body: { email, name, password },
		})

		expect(userAuthResponse.user).toBeDefined()

		const signIn = await authService.api.signInEmail({
			body: { email, password },
		})

		expect(signIn.token).toBeDefined()
		const jwt = signIn.token

		// Find current session ID
		const currentSession = await prisma.session.findFirst({
			where: {
				userId: userAuthResponse.user!.id,
				token: jwt,
			},
		})

		expect(currentSession).toBeDefined()

		const response = await request(app.getHttpServer())
			.delete(`/sessions/${currentSession!.id}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: header casing
				Authorization: `Bearer ${jwt}`,
			})
			.expect(400)

		expect(response.body.message).toBe('Cannot revoke current session')

		// Clean up
		await prisma.session.deleteMany({
			where: { userId: userAuthResponse.user?.id },
		})
		await prisma.account.deleteMany({
			where: { userId: userAuthResponse.user?.id },
		})
		await prisma.user.delete({ where: { id: userAuthResponse.user?.id } })
	})

	it('[DELETE] /sessions/:id - returns 404 when session belongs to another user', async () => {
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
		const signIn2 = await authService.api.signInEmail({
			body: { email: email2, password },
		})

		// Find user2's session
		const user2Session = await prisma.session.findFirst({
			where: {
				userId: user2.user!.id,
				token: signIn2.token,
			},
		})

		expect(user2Session).toBeDefined()

		// Try to revoke user2's session using user1's token → 404
		const response = await request(app.getHttpServer())
			.delete(`/sessions/${user2Session!.id}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: header casing
				Authorization: `Bearer ${signIn1.token}`,
			})
			.expect(404)

		expect(response.body.message).toBe('Session not found')

		// Clean up
		await prisma.session.deleteMany({ where: { userId: user1.user?.id } })
		await prisma.account.deleteMany({ where: { userId: user1.user?.id } })
		await prisma.user.delete({ where: { id: user1.user?.id } })

		await prisma.session.deleteMany({ where: { userId: user2.user?.id } })
		await prisma.account.deleteMany({ where: { userId: user2.user?.id } })
		await prisma.user.delete({ where: { id: user2.user?.id } })
	})

	it('[DELETE] /sessions/:id - returns 401 when not authenticated', async () => {
		await request(app.getHttpServer())
			.delete('/sessions/some-session-id')
			.expect(401)
	})
})
