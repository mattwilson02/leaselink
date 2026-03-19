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

describe('UploadClientProfilePhotoController (E2E)', () => {
	let app: INestApplication
	let jwtFactory: JwtFactory
	let prisma: PrismaService
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
		prisma = moduleRef.get(PrismaService)

		await app.init()
	})

	afterAll(async () => {
		await app.close()
	})

	it('[PUT] /clients/:clientId/profile-photo', async () => {
		const { jwt } = await jwtFactory.makeJwt()
		const client = await clientFactory.makePrismaClient()

		const profilePhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...'

		const response = await request(app.getHttpServer())
			.put(`/clients/${client.id.toString()}/profile-photo`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({ profilePhoto })
			.expect(200)

		expect(response.body).toEqual({
			message: 'Profile photo uploaded successfully',
		})

		const updatedClient = await prisma.client.findUnique({
			where: { id: client.id.toString() },
		})

		expect(updatedClient?.profilePhoto).toBe(profilePhoto)
	})

	it('[PUT] /clients/:clientId/profile-photo - should replace existing photo', async () => {
		const { jwt } = await jwtFactory.makeJwt()
		const client = await clientFactory.makePrismaClient({
			profilePhoto: 'data:image/png;base64,oldPhotoData...',
		})

		const newProfilePhoto = 'data:image/png;base64,newPhotoData...'

		const response = await request(app.getHttpServer())
			.put(`/clients/${client.id.toString()}/profile-photo`)
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({ profilePhoto: newProfilePhoto })
			.expect(200)

		expect(response.body).toEqual({
			message: 'Profile photo uploaded successfully',
		})

		const updatedClient = await prisma.client.findUnique({
			where: { id: client.id.toString() },
		})

		expect(updatedClient?.profilePhoto).toBe(newProfilePhoto)
	})

	it('[PUT] /clients/:clientId/profile-photo - should return 404 for nonexistent client', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const response = await request(app.getHttpServer())
			.put('/clients/non-existent-id/profile-photo')
			.set({
				// biome-ignore lint/style/useNamingConvention: HTTP header
				Authorization: `Bearer ${jwt}`,
			})
			.send({ profilePhoto: 'data:image/png;base64,someData...' })
			.expect(404)

		expect(response.body.message).toBe('Client not found.')
	})
})
