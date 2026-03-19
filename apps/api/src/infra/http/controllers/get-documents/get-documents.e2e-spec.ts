import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { faker } from '@faker-js/faker'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { authUserClientIdE2E } from 'test/utils/auth-user-id-e2e'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('GetDocumentsByClientIdController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwtFactory: JwtFactory

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)
		const moduleRef = await Test.createTestingModule({
			imports: [DatabaseModule, BetterAuthModule, EnvModule, testAppModule],
			providers: [JwtFactory],
		}).compile()

		app = moduleRef.createNestApplication()
		prisma = moduleRef.get(PrismaService)
		jwtFactory = moduleRef.get(JwtFactory)

		await app.init()
	})

	it('[GET] /documents - should retrieve documents for a client', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		const clientAuth = await prisma.identityProvider.findFirst({
			where: {
				providerUserId: authUserClientIdE2E,
			},
		})

		if (!clientAuth?.userId) {
			throw new Error('Client user ID not found')
		}

		const clientId = clientAuth?.userId
		const documentOneId = faker.string.uuid()
		await prisma.document.createMany({
			data: [
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Document 1',
					blobName: 'document1.pdf',
					thumbnailBlobName: 'thumbnail1.png',
					fileSize: 10,
					folder: 'IDENTIFICATION',
					uploadedBy: clientId,
					createdAt: new Date('2023-01-01'),
					updatedAt: new Date(),
					version: 1,
					contentKey: documentOneId,
				},
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Document 1',
					blobName: 'document1.pdf',
					thumbnailBlobName: 'thumbnail1.png',
					fileSize: 10,
					folder: 'IDENTIFICATION',
					uploadedBy: clientId,
					createdAt: new Date('2023-01-01'),
					updatedAt: new Date(),
					version: 2,
					contentKey: documentOneId,
				},
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Document 2',
					blobName: 'document2.pdf',
					thumbnailBlobName: 'thumbnail1.png',
					fileSize: 10,
					folder: 'IDENTIFICATION',
					uploadedBy: clientId,
					createdAt: new Date('2023-01-02'),
					updatedAt: new Date(),
					version: 1,
					contentKey: faker.string.uuid(),
				},
			],
		})

		const response = await request(app.getHttpServer())
			.get('/documents')
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.query({ offset: 0, limit: 10 })
			.expect(200)

		expect(response.body).toBeDefined()
		expect(response.body.documents).toHaveLength(2)
		expect(response.body.documents).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: 'Document 1',
					blobName: 'document1.pdf',
					thumbnailBlobName: 'thumbnail1.png',
					fileSize: 10,
					folder: 'IDENTIFICATION',
					version: 2,
				}),
				expect.not.objectContaining({
					name: 'Document 1',
					version: 1,
				}),
				expect.objectContaining({
					name: 'Document 2',
					blobName: 'document2.pdf',
					thumbnailBlobName: 'thumbnail1.png',
					fileSize: 10,
					folder: 'IDENTIFICATION',
				}),
			]),
		)
	})

	it('[GET] /documents - should return 204 if no documents are found', async () => {
		const { jwt } = await jwtFactory.makeJwt()
		await request(app.getHttpServer())
			.get('/documents')
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.query({ offset: 0, limit: 10 })
			.expect(204)
	})

	it('[GET] /documents - should retrieve documents for a client with only certain folder types', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		const clientAuth = await prisma.identityProvider.findFirst({
			where: {
				providerUserId: authUserClientIdE2E,
			},
		})

		if (!clientAuth?.userId) {
			throw new Error('Client user ID not found')
		}

		const clientId = clientAuth?.userId
		const documentOneId = faker.string.uuid()
		await prisma.document.createMany({
			data: [
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Document 1',
					blobName: 'document1.pdf',
					thumbnailBlobName: 'thumbnail1.png',
					fileSize: 10,
					folder: 'INSPECTION_REPORTS',
					uploadedBy: clientId,
					createdAt: new Date('2023-01-01'),
					updatedAt: new Date(),
					version: 1,
					contentKey: documentOneId,
				},
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Document 1',
					blobName: 'document1.pdf',
					thumbnailBlobName: 'thumbnail1.png',
					fileSize: 10,
					folder: 'INSPECTION_REPORTS',
					uploadedBy: clientId,
					createdAt: new Date('2023-01-01'),
					updatedAt: new Date(),
					version: 2,
					contentKey: documentOneId,
				},
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Document 2',
					blobName: 'document2.pdf',
					thumbnailBlobName: 'thumbnail1.png',
					fileSize: 10,
					folder: 'INSPECTION_REPORTS',
					uploadedBy: clientId,
					createdAt: new Date('2023-01-02'),
					updatedAt: new Date(),
					version: 1,
					contentKey: faker.string.uuid(),
				},
			],
		})

		const response = await request(app.getHttpServer())
			.get('/documents')
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.query({ offset: 0, limit: 10, folders: ['INSPECTION_REPORTS'] })
			.expect(200)

		expect(response.body).toBeDefined()
		expect(response.body.documents).toHaveLength(2)
		expect(response.body.documents).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: 'Document 1',
					blobName: 'document1.pdf',
					thumbnailBlobName: 'thumbnail1.png',
					fileSize: 10,
					folder: 'INSPECTION_REPORTS',
					version: 2,
				}),
				expect.not.objectContaining({
					name: 'Document 1',
					version: 1,
				}),
				expect.objectContaining({
					name: 'Document 2',
					blobName: 'document2.pdf',
					thumbnailBlobName: 'thumbnail1.png',
					fileSize: 10,
					folder: 'INSPECTION_REPORTS',
				}),
			]),
		)
	})
})
