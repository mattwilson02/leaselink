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

describe('EditClientStatusController (E2E)', () => {
	let app: INestApplication
	let jwtFactory: JwtFactory
	let prisma: PrismaService
	let clientWithValidSessionAndJwtFactory: ClientWithValidSessionAndJwtFactory

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
		clientWithValidSessionAndJwtFactory = moduleRef.get(
			ClientWithValidSessionAndJwtFactory,
		)
		prisma = moduleRef.get(PrismaService)

		await app.init()
	})

	it('[PUT] /clients/:clientId', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const newClient = {
			name: faker.person.fullName(),
			email: faker.internet.email(),
			phoneNumber: '1-602-392-7541', // Static fake phone number
		}

		await request(app.getHttpServer())
			.post('/clients')
			.set({
				// biome-ignore lint/style/useNamingConvention: <explanation>
				Authorization: `Bearer ${jwt}`,
			})
			.send(newClient)

		await vi.waitFor(async () => {
			const client = await prisma.client.findFirst({
				where: {
					email: newClient.email,
				},
			})

			const response = await request(app.getHttpServer())
				.put(`/clients/${client?.id}`)
				.set({
					// biome-ignore lint/style/useNamingConvention: <explanation>
					Authorization: `Bearer ${jwt}`,
				})
				.send({
					status: 'ACTIVE',
					onboardingStatus: 'ONBOARDED',
					deviceId: '1234567890',
					pushToken: '1234567890',
				})
				.expect(200)

			expect(response.body).toBeDefined()
			expect(response.body.status).toBe('ACTIVE')
			expect(response.body.onboardingStatus).toBe('ONBOARDED')

			const user = await prisma.client.findFirst({
				where: {
					id: client?.id,
				},
			})

			expect(user?.deviceId).toBe('1234567890')
			expect(user?.pushToken).toBe('1234567890')

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
