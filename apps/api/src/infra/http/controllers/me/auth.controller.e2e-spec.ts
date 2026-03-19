import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('AuthController (e2e)', () => {
	let app: INestApplication
	let jwtFactory: JwtFactory

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)
		const moduleRef = await Test.createTestingModule({
			imports: [BetterAuthModule, testAppModule],
			providers: [JwtFactory],
		}).compile()

		app = moduleRef.createNestApplication()
		jwtFactory = moduleRef.get(JwtFactory)

		await app.init()
	})

	it('[GET] /auth/me', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const response = await request(app.getHttpServer())
			.get('/auth/me')
			.set({
				// biome-ignore lint/style/useNamingConvention: <Casing is fine like this>
				Authorization: `Bearer ${jwt}`,
				'Device-Id': 'test-device-id',
			})
			.expect(200)

		expect(response.body).toEqual(
			expect.objectContaining({
				id: expect.any(String),
				name: expect.any(String),
				isDeviceRecognized: expect.any(Boolean),
			}),
		)
	})
})
