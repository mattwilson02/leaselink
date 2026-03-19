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

describe('ViewDocumentByIdController (E2E)', () => {
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

	it('[PUT] /documents/:documentId/view - should mark a document as viewed', async () => {
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
		const documentId = faker.string.uuid()

		await prisma.document.create({
			data: {
				id: documentId,
				clientId,
				name: 'Test Document',
				blobName: 'test.pdf',
				thumbnailBlobName: 'test-thumb.png',
				fileSize: 10000,
				folder: 'IDENTIFICATION',
				uploadedBy: clientId,
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date(),
				version: 1,
				contentKey: faker.string.uuid(),
				viewedAt: null,
			},
		})

		const response = await request(app.getHttpServer())
			.put(`/documents/${documentId}/view`)
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body).toBeDefined()
		expect(response.body.document).toBeDefined()
		expect(response.body.document.name).toBe('Test Document')

		// Verify viewedAt was updated in the database
		const updatedDocument = await prisma.document.findUnique({
			where: { id: documentId },
		})

		expect(updatedDocument?.viewedAt).not.toBeNull()
		expect(updatedDocument?.viewedAt).toBeInstanceOf(Date)
	})

	it('[PUT] /documents/:documentId/view - should update viewedAt for previously viewed document', async () => {
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
		const documentId = faker.string.uuid()
		const previousViewDate = new Date('2024-01-01')

		await prisma.document.create({
			data: {
				id: documentId,
				clientId,
				name: 'Previously Viewed Document',
				blobName: 'test.pdf',
				thumbnailBlobName: 'test-thumb.png',
				fileSize: 10000,
				folder: 'IDENTIFICATION',
				uploadedBy: clientId,
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date(),
				version: 1,
				contentKey: faker.string.uuid(),
				viewedAt: previousViewDate,
			},
		})

		await request(app.getHttpServer())
			.put(`/documents/${documentId}/view`)
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		// Verify viewedAt was updated to a new timestamp
		const updatedDocument = await prisma.document.findUnique({
			where: { id: documentId },
		})

		expect(updatedDocument?.viewedAt).not.toBeNull()
		expect(updatedDocument?.viewedAt?.getTime()).toBeGreaterThan(
			previousViewDate.getTime(),
		)
	})

	it('[PUT] /documents/:documentId/view - should return 404 for non-existent document', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)
		const nonExistentDocumentId = faker.string.uuid()

		await request(app.getHttpServer())
			.put(`/documents/${nonExistentDocumentId}/view`)
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(404)
	})

	it('[PUT] /documents/:documentId/view - should return 401 for unauthorized requests', async () => {
		const documentId = faker.string.uuid()

		await request(app.getHttpServer())
			.put(`/documents/${documentId}/view`)
			.expect(401)
	})

	it('[PUT] /documents/:documentId/view - should handle multiple views of same document', async () => {
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
		const documentId = faker.string.uuid()

		await prisma.document.create({
			data: {
				id: documentId,
				clientId,
				name: 'Multiple Views Document',
				blobName: 'test.pdf',
				thumbnailBlobName: 'test-thumb.png',
				fileSize: 10000,
				folder: 'IDENTIFICATION',
				uploadedBy: clientId,
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date(),
				version: 1,
				contentKey: faker.string.uuid(),
				viewedAt: null,
			},
		})

		// First view
		await request(app.getHttpServer())
			.put(`/documents/${documentId}/view`)
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		const firstView = await prisma.document.findUnique({
			where: { id: documentId },
		})

		// Wait a bit to ensure different timestamp
		await new Promise((resolve) => setTimeout(resolve, 100))

		// Second view
		await request(app.getHttpServer())
			.put(`/documents/${documentId}/view`)
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		const secondView = await prisma.document.findUnique({
			where: { id: documentId },
		})

		expect(firstView?.viewedAt).not.toBeNull()
		expect(secondView?.viewedAt).not.toBeNull()
		expect(secondView?.viewedAt?.getTime()).toBeGreaterThanOrEqual(
			firstView?.viewedAt?.getTime() || 0,
		)
	})

	it('[PUT] /documents/:documentId/view - should only update viewedAt for the specific document version', async () => {
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
		const contentKey = faker.string.uuid()
		const docV1Id = faker.string.uuid()
		const docV2Id = faker.string.uuid()

		// Create two versions of the same document
		await prisma.document.createMany({
			data: [
				{
					id: docV1Id,
					clientId,
					name: 'Document v1',
					blobName: 'test_v1.pdf',
					thumbnailBlobName: 'test_v1-thumb.png',
					fileSize: 10000,
					folder: 'IDENTIFICATION',
					uploadedBy: clientId,
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date(),
					version: 1,
					contentKey,
					viewedAt: null,
				},
				{
					id: docV2Id,
					clientId,
					name: 'Document v2',
					blobName: 'test_v2.pdf',
					thumbnailBlobName: 'test_v2-thumb.png',
					fileSize: 15000,
					folder: 'IDENTIFICATION',
					uploadedBy: clientId,
					createdAt: new Date('2024-01-02'),
					updatedAt: new Date(),
					version: 2,
					contentKey,
					viewedAt: null,
				},
			],
		})

		// View only version 2
		await request(app.getHttpServer())
			.put(`/documents/${docV2Id}/view`)
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		// Verify only v2 was updated
		const docV1 = await prisma.document.findUnique({
			where: { id: docV1Id },
		})
		const docV2 = await prisma.document.findUnique({
			where: { id: docV2Id },
		})

		expect(docV1?.viewedAt).toBeNull()
		expect(docV2?.viewedAt).not.toBeNull()
	})
})
