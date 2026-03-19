import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { faker } from '@faker-js/faker'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ClientFactory } from 'test/factories/make-client'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('DeleteClientController (E2E)', () => {
	let app: INestApplication
	let jwtFactory: JwtFactory
	let prisma: PrismaService

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)
		const moduleRef = await Test.createTestingModule({
			imports: [DatabaseModule, BetterAuthModule, EnvModule, testAppModule],
			providers: [ClientFactory, JwtFactory],
		}).compile()

		app = moduleRef.createNestApplication()
		jwtFactory = moduleRef.get(JwtFactory)
		prisma = moduleRef.get(PrismaService)

		await app.init()
	})

	it('[DELETE] /clients/:clientId', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		const newClient = {
			name: faker.person.fullName(),
			email: faker.internet.email(),
			phoneNumber: '1-814-800-5362 x2303', // Static fake phone number,
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
				.delete(`/clients/${client?.id}`)
				.set({
					// biome-ignore lint/style/useNamingConvention: <explanation>
					Authorization: `Bearer ${jwt}`,
				})
				.send({
					status: 'ACTIVE',
				})
				.expect(204)

			expect(response.body).toBeDefined()

			const identityProvider = await prisma.identityProvider.findFirst({
				where: {
					userId: client?.id,
				},
			})

			const searchedClientOneMoreTime = await prisma.client.findFirst({
				where: {
					email: newClient.email,
				},
			})

			expect(searchedClientOneMoreTime).toBeFalsy()
			expect(identityProvider).toBeFalsy()
		})
	})
})
