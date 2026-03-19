import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { faker } from '@faker-js/faker'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ClientFactory } from 'test/factories/make-client'
import { ClientWithValidSessionAndJwtFactory } from 'test/factories/make-client-with-valid-session-and-jwt-factory'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('CreateClientController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwtFactory: JwtFactory
	let clientWithValidSessionAndJwtFactory: ClientWithValidSessionAndJwtFactory

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)

		const moduleRef = await Test.createTestingModule({
			imports: [testAppModule, DatabaseModule, EnvModule, BetterAuthModule],
			providers: [
				ClientFactory,
				JwtFactory,
				ClientWithValidSessionAndJwtFactory,
			],
		}).compile()

		prisma = moduleRef.get(PrismaService)
		app = moduleRef.createNestApplication()
		jwtFactory = moduleRef.get(JwtFactory)
		clientWithValidSessionAndJwtFactory = moduleRef.get(
			ClientWithValidSessionAndJwtFactory,
		)

		await app.init()
	}, 30000) // 30 second timeout for app initialization

	it('[POST] /clients', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const newClient = {
			name: faker.person.fullName(),
			email: faker.internet.email(),
			phoneNumber: faker.phone.number(), //Static Mock Phone Number
		}

		await request(app.getHttpServer())
			.post('/clients')
			.set({
				// biome-ignore lint/style/useNamingConvention: <explanation>
				Authorization: `Bearer ${jwt}`,
			})
			.send(newClient)
			.expect(201)

		await vi.waitFor(async () => {
			const client = await prisma.client.findFirst({
				where: {
					email: newClient.email,
				},
			})

			const identityProvider = await prisma.identityProvider.findFirst({
				where: {
					userId: client?.id,
				},
			})

			if (identityProvider?.providerUserId) {
				await clientWithValidSessionAndJwtFactory.deleteCreatedClientForJwtFactory(
					identityProvider.providerUserId,
				)
			}

			expect(identityProvider).not.toBeFalsy()
		})
	})
})
