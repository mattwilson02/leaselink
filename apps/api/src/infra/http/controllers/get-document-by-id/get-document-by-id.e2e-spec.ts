import { DatabaseModule } from '@/infra/database/database.module'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { faker } from '@faker-js/faker'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('GetDocumentByIdController (E2E)', () => {
	let app: INestApplication
	let jwtFactory: JwtFactory

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)
		const moduleRef = await Test.createTestingModule({
			imports: [DatabaseModule, BetterAuthModule, EnvModule, testAppModule],
			providers: [JwtFactory],
		}).compile()

		app = moduleRef.createNestApplication()
		jwtFactory = moduleRef.get(JwtFactory)

		await app.init()
	})

	it('[GET] /documents/:documentId - should return 404 if document does not exist', async () => {
		const { jwt } = await jwtFactory.makeJwt()
		const nonExistentId = faker.string.uuid()

		await request(app.getHttpServer())
			.get(`/documents/:${nonExistentId}`)
			.set({
				// biome-ignore lint/style/useNamingConvention: <This is fine>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(404)
	})
})
