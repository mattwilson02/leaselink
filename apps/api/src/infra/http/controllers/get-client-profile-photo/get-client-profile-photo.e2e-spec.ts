import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ClientFactory } from 'test/factories/make-client'
import { ClientWithValidSessionAndJwtFactory } from 'test/factories/make-client-with-valid-session-and-jwt-factory'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('GetClientProfilePhotoController (E2E)', () => {
	let app: INestApplication
	let jwtFactory: JwtFactory
	let clientFactory: ClientFactory

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)

		const moduleRef = await Test.createTestingModule({
			imports: [DatabaseModule, BetterAuthModule, EnvModule, testAppModule],
			providers: [
				ClientFactory,
				JwtFactory,
				ClientWithValidSessionAndJwtFactory,
			],
		}).compile()

		app = moduleRef.createNestApplication()
		jwtFactory = moduleRef.get(JwtFactory)
		clientFactory = moduleRef.get(ClientFactory)

		await app.init()
	})

	afterAll(async () => {
		await app.close()
	})

	it('[GET] /clients/:clientId/profile-photo', async () => {
		const { jwt } = await jwtFactory.makeJwt()
		const profilePhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...'
		const client = await clientFactory.makePrismaClient({ profilePhoto })

		const response = await request(app.getHttpServer())
			.get(`/clients/${client.id.toString()}/profile-photo`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body).toEqual({ profilePhoto })
	})

	it('[GET] /clients/:clientId/profile-photo - should return null when no photo exists', async () => {
		const { jwt } = await jwtFactory.makeJwt()
		const client = await clientFactory.makePrismaClient()

		const response = await request(app.getHttpServer())
			.get(`/clients/${client.id.toString()}/profile-photo`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body).toEqual({ profilePhoto: null })
	})

	it('[GET] /clients/:clientId/profile-photo - should return 404 for nonexistent client', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const response = await request(app.getHttpServer())
			.get('/clients/non-existent-id/profile-photo')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.expect(404)

		expect(response.body.message).toBe('Client not found.')
	})
})
