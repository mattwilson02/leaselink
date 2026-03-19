import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { createTestAppModule } from 'test/utils/test-app.module'
import { AuthService } from '@thallesp/nestjs-better-auth'

describe('Password Reset Flow (E2E)', () => {
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

	afterEach(async () => {
		// Clean up test verification records after each test
		await prisma.verification.deleteMany({
			where: {
				identifier: {
					startsWith: 'reset-password:',
				},
			},
		})
	})

	it('[POST] /api/auth/reset-password - full flow with test account', async () => {
		const testEmail = 'test+resetpassword@example.com'
		const initialPassword = 'OldPassword123!'
		const newPassword = 'NewPassword123!'

		// 1. Create a test user
		await authService.api.signUpEmail({
			body: {
				email: testEmail,
				name: 'Test Reset User',
				password: initialPassword,
			},
		})

		// 2. Request password reset
		await authService.api.requestPasswordReset({
			body: {
				email: testEmail,
				redirectTo: '/reset-password',
			},
		})

		// Wait a moment for the async token replacement to complete
		await new Promise((resolve) => setTimeout(resolve, 250))

		// 3. Verify the static token was created
		const verification = await prisma.verification.findFirst({
			where: {
				identifier: 'reset-password:test-reset-token-e2e',
			},
		})

		expect(verification).toBeDefined()
		expect(verification?.identifier).toBe('reset-password:test-reset-token-e2e')

		// 4. Reset password using the static test token
		// The endpoint is public - no authentication required
		const resetResponse = await request(app.getHttpServer())
			.post('/api/auth/reset-password')
			.send({
				token: 'test-reset-token-e2e',
				newPassword: newPassword,
			})

		expect(resetResponse.status).toBe(200)
		expect(resetResponse).toBeDefined()

		// 4. Verify we can sign in with the new password
		const signInResponse = await authService.api.signInEmail({
			body: {
				email: testEmail,
				password: newPassword,
			},
		})

		expect(signInResponse.token).toBeDefined()
		expect(signInResponse.user?.email).toBe(testEmail)

		// 5. Verify we CANNOT sign in with the old password
		await expect(
			authService.api.signInEmail({
				body: {
					email: testEmail,
					password: initialPassword,
				},
			}),
		).rejects.toThrow()

		// Cleanup
		const user = await prisma.user.findUnique({
			where: { email: testEmail },
		})

		if (user) {
			await prisma.session.deleteMany({ where: { userId: user.id } })
			await prisma.account.deleteMany({ where: { userId: user.id } })
			await prisma.user.delete({ where: { id: user.id } })
		}
	})

	it('[POST] /api/auth/reset-password - should fail with invalid token', async () => {
		const testEmail = 'test+invalidtoken@example.com'
		const initialPassword = 'OldPassword123!'

		// Create a test user
		await authService.api.signUpEmail({
			body: {
				email: testEmail,
				name: 'Test Invalid Token User',
				password: initialPassword,
			},
		})

		// Request password reset (creates verification token)
		await authService.api.requestPasswordReset({
			body: {
				email: testEmail,
				redirectTo: '/reset-password',
			},
		})

		// Verify the token was created
		const verification = await prisma.verification.findFirst({
			where: {
				identifier: `password-reset:${testEmail}`,
			},
		})
		expect(verification).toBeDefined()

		// Try to reset with a wrong token
		await request(app.getHttpServer())
			.post('/api/auth/reset-password')
			.send({
				token: 'wrong-token-12345',
				newPassword: 'NewPassword123!',
			})
			.expect(400)

		// Cleanup
		const user = await prisma.user.findUnique({
			where: { email: testEmail },
		})

		if (user) {
			await prisma.session.deleteMany({ where: { userId: user.id } })
			await prisma.account.deleteMany({ where: { userId: user.id } })
			await prisma.user.delete({ where: { id: user.id } })
		}
	})

	it('[POST] /api/auth/reset-password - should fail without requesting reset first', async () => {
		await request(app.getHttpServer())
			.post('/api/auth/reset-password')
			.send({
				token: 'nonexistent-token-12345',
				newPassword: 'NewPassword123!',
			})
			.expect(400)
	})
})
