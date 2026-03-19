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
import { DOCUMENT_FOLDER } from '@prisma/client'

describe('GetRecentlyViewedDocumentsController (E2E)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwtFactory: JwtFactory

	beforeEach(async () => {
		await prisma.document.deleteMany()
	})

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

	it('[GET] /recently-viewed-documents - should retrieve recently viewed documents sorted by viewedAt', async () => {
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
		const now = new Date()

		await prisma.document.createMany({
			data: [
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Document 1',
					blobName: 'document1.pdf',
					thumbnailBlobName: 'thumbnail1.png',
					fileSize: 10000,
					folder: DOCUMENT_FOLDER.IDENTIFICATION,
					uploadedBy: clientId,
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date(),
					version: 1,
					contentKey: faker.string.uuid(),
					viewedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
				},
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Document 2',
					blobName: 'document2.pdf',
					thumbnailBlobName: 'thumbnail2.png',
					fileSize: 20000,
					folder: 'INSURANCE',
					uploadedBy: clientId,
					createdAt: new Date('2024-01-02'),
					updatedAt: new Date(),
					version: 1,
					contentKey: faker.string.uuid(),
					viewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
				},
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Document 3',
					blobName: 'document3.pdf',
					thumbnailBlobName: 'thumbnail3.png',
					fileSize: 30000,
					folder: 'SIGNED_DOCUMENTS',
					uploadedBy: clientId,
					createdAt: new Date('2024-01-03'),
					updatedAt: new Date(),
					version: 1,
					contentKey: faker.string.uuid(),
					viewedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
				},
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Document 4 - Not Viewed',
					blobName: 'document4.pdf',
					thumbnailBlobName: 'thumbnail4.png',
					fileSize: 40000,
					folder: 'OTHER',
					uploadedBy: clientId,
					createdAt: new Date('2024-01-04'),
					updatedAt: new Date(),
					version: 1,
					contentKey: faker.string.uuid(),
					viewedAt: null,
				},
			],
		})

		const response = await request(app.getHttpServer())
			.get('/recently-viewed-documents')
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body).toBeDefined()
		expect(response.body.documents).toHaveLength(3)

		// Documents should be sorted by viewedAt descending (most recent first)
		expect(response.body.documents[0].name).toBe('Document 2')
		expect(response.body.documents[1].name).toBe('Document 3')
		expect(response.body.documents[2].name).toBe('Document 1')

		// Document 4 should not be in the results because it has no viewedAt
		expect(
			response.body.documents.find(
				(doc: { name: string }) => doc.name === 'Document 4 - Not Viewed',
			),
		).toBeUndefined()
	})

	it('[GET] /recently-viewed-documents - should respect the limit parameter', async () => {
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
		const now = new Date()

		// Create 5 viewed documents
		const documents = []
		for (let i = 0; i < 5; i++) {
			documents.push({
				id: faker.string.uuid(),
				clientId,
				name: `Document ${i}`,
				blobName: `document${i}.pdf`,
				thumbnailBlobName: `thumbnail${i}.png`,
				fileSize: 10000 * (i + 1),
				folder: DOCUMENT_FOLDER.IDENTIFICATION,
				uploadedBy: clientId,
				createdAt: new Date(`2024-01-0${i + 1}`),
				updatedAt: new Date(),
				version: 1,
				contentKey: faker.string.uuid(),
				viewedAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
			})
		}

		await prisma.document.createMany({
			data: documents,
		})

		const response = await request(app.getHttpServer())
			.get('/recently-viewed-documents')
			.query({ limit: 2 })
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body).toBeDefined()
		expect(response.body.documents).toHaveLength(2)
	})

	it('[GET] /recently-viewed-documents - should return 204 if no documents have been viewed', async () => {
		const { jwt } = await jwtFactory.makeJwt()

		await request(app.getHttpServer())
			.get('/recently-viewed-documents')
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(204)
	})

	it('[GET] /recently-viewed-documents - should return only the latest version of each document', async () => {
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
		const now = new Date()

		await prisma.document.createMany({
			data: [
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Document v1',
					blobName: 'document_v1.pdf',
					thumbnailBlobName: 'thumbnail_v1.png',
					fileSize: 10000,
					folder: DOCUMENT_FOLDER.IDENTIFICATION,
					uploadedBy: clientId,
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date(),
					version: 1,
					contentKey,
					viewedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
				},
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Document v2',
					blobName: 'document_v2.pdf',
					thumbnailBlobName: 'thumbnail_v2.png',
					fileSize: 15000,
					folder: DOCUMENT_FOLDER.IDENTIFICATION,
					uploadedBy: clientId,
					createdAt: new Date('2024-01-02'),
					updatedAt: new Date(),
					version: 2,
					contentKey,
					viewedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
				},
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Document v3',
					blobName: 'document_v3.pdf',
					thumbnailBlobName: 'thumbnail_v3.png',
					fileSize: 20000,
					folder: DOCUMENT_FOLDER.IDENTIFICATION,
					uploadedBy: clientId,
					createdAt: new Date('2024-01-03'),
					updatedAt: new Date(),
					version: 3,
					contentKey,
					viewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
				},
			],
		})

		const response = await request(app.getHttpServer())
			.get('/recently-viewed-documents')
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body).toBeDefined()
		expect(response.body.documents).toHaveLength(1)
		expect(response.body.documents[0].name).toBe('Document v3')
		expect(response.body.documents[0].version).toBe(3)
	})

	it('[GET] /recently-viewed-documents - should return 401 for unauthorized requests', async () => {
		await request(app.getHttpServer())
			.get('/recently-viewed-documents')
			.expect(401)
	})

	it('[GET] /recently-viewed-documents - should default to limit of 10', async () => {
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
		const now = new Date()

		// Create 15 viewed documents
		const documents = []
		for (let i = 0; i < 15; i++) {
			documents.push({
				id: faker.string.uuid(),
				clientId,
				name: `Document ${i}`,
				blobName: `document${i}.pdf`,
				thumbnailBlobName: `thumbnail${i}.png`,
				fileSize: 10000 * (i + 1),
				folder: DOCUMENT_FOLDER.IDENTIFICATION,
				uploadedBy: clientId,
				createdAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
				updatedAt: new Date(),
				version: 1,
				contentKey: faker.string.uuid(),
				viewedAt: new Date(now.getTime() - i * 60 * 60 * 1000), // Hours apart
			})
		}

		await prisma.document.createMany({
			data: documents,
		})

		const response = await request(app.getHttpServer())
			.get('/recently-viewed-documents')
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body).toBeDefined()
		expect(response.body.documents).toHaveLength(10)
	})

	it('[GET] /recently-viewed-documents - should filter documents by folderName', async () => {
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
		const now = new Date()

		await prisma.document.createMany({
			data: [
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Tax Document 1',
					blobName: 'tax1.pdf',
					thumbnailBlobName: 'tax1-thumb.png',
					fileSize: 10000,
					folder: DOCUMENT_FOLDER.INSURANCE,
					uploadedBy: clientId,
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date(),
					version: 1,
					contentKey: faker.string.uuid(),
					viewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
				},
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Tax Document 2',
					blobName: 'tax2.pdf',
					thumbnailBlobName: 'tax2-thumb.png',
					fileSize: 15000,
					folder: DOCUMENT_FOLDER.INSURANCE,
					uploadedBy: clientId,
					createdAt: new Date('2024-01-02'),
					updatedAt: new Date(),
					version: 1,
					contentKey: faker.string.uuid(),
					viewedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
				},
				{
					id: faker.string.uuid(),
					clientId,
					name: 'ID Document',
					blobName: 'id.pdf',
					thumbnailBlobName: 'id-thumb.png',
					fileSize: 12000,
					folder: DOCUMENT_FOLDER.IDENTIFICATION,
					uploadedBy: clientId,
					createdAt: new Date('2024-01-03'),
					updatedAt: new Date(),
					version: 1,
					contentKey: faker.string.uuid(),
					viewedAt: new Date(now.getTime() - 30 * 60 * 1000), // Most recent
				},
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Investment Statement',
					blobName: 'investment.pdf',
					thumbnailBlobName: 'investment-thumb.png',
					fileSize: 20000,
					folder: DOCUMENT_FOLDER.LEASE_AGREEMENTS,
					uploadedBy: clientId,
					createdAt: new Date('2024-01-04'),
					updatedAt: new Date(),
					version: 1,
					contentKey: faker.string.uuid(),
					viewedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
				},
			],
		})

		const response = await request(app.getHttpServer())
			.get('/recently-viewed-documents')
			.query({ folderName: 'INSURANCE' })
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body).toBeDefined()
		expect(response.body.documents).toHaveLength(2)
		expect(response.body.documents[0].name).toBe('Tax Document 1')
		expect(response.body.documents[0].folder).toBe('INSURANCE')
		expect(response.body.documents[1].name).toBe('Tax Document 2')
		expect(response.body.documents[1].folder).toBe('INSURANCE')
	})

	it('[GET] /recently-viewed-documents - should return 204 when filtering by folderName with no matches', async () => {
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
		const now = new Date()

		await prisma.document.create({
			data: {
				id: faker.string.uuid(),
				clientId,
				name: 'ID Document',
				blobName: 'id.pdf',
				thumbnailBlobName: 'id-thumb.png',
				fileSize: 12000,
				folder: DOCUMENT_FOLDER.IDENTIFICATION,
				uploadedBy: clientId,
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date(),
				version: 1,
				contentKey: faker.string.uuid(),
				viewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
			},
		})

		await request(app.getHttpServer())
			.get('/recently-viewed-documents')
			.query({ folderName: 'INSURANCE' })
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(204)
	})

	it('[GET] /recently-viewed-documents - should filter by folderName and respect limit', async () => {
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
		const now = new Date()

		// Create 10 tax documents
		const taxDocs = []
		for (let i = 0; i < 10; i++) {
			taxDocs.push({
				id: faker.string.uuid(),
				clientId,
				name: `Tax Document ${i}`,
				blobName: `tax${i}.pdf`,
				thumbnailBlobName: `tax${i}-thumb.png`,
				fileSize: 10000 * (i + 1),
				folder: DOCUMENT_FOLDER.INSURANCE,
				uploadedBy: clientId,
				createdAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
				updatedAt: new Date(),
				version: 1,
				contentKey: faker.string.uuid(),
				viewedAt: new Date(now.getTime() - i * 60 * 60 * 1000),
			})
		}

		// Create 5 identification documents
		const idDocs = []
		for (let i = 0; i < 5; i++) {
			idDocs.push({
				id: faker.string.uuid(),
				clientId,
				name: `ID Document ${i}`,
				blobName: `id${i}.pdf`,
				thumbnailBlobName: `id${i}-thumb.png`,
				fileSize: 10000 * (i + 1),
				folder: DOCUMENT_FOLDER.IDENTIFICATION,
				uploadedBy: clientId,
				createdAt: new Date(`2024-02-${String(i + 1).padStart(2, '0')}`),
				updatedAt: new Date(),
				version: 1,
				contentKey: faker.string.uuid(),
				viewedAt: new Date(now.getTime() - i * 60 * 60 * 1000),
			})
		}

		await prisma.document.createMany({
			data: [...taxDocs, ...idDocs],
		})

		const response = await request(app.getHttpServer())
			.get('/recently-viewed-documents')
			.query({ folderName: 'INSURANCE', limit: 3 })
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body).toBeDefined()
		expect(response.body.documents).toHaveLength(3)

		// All documents should be from INSURANCE folder
		for (const doc of response.body.documents) {
			expect(doc.folder).toBe('INSURANCE')
		}
	})

	it('[GET] /recently-viewed-documents - should filter by folderName and return only latest versions', async () => {
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
		const now = new Date()

		await prisma.document.createMany({
			data: [
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Tax Document v1',
					blobName: 'tax_v1.pdf',
					thumbnailBlobName: 'tax_v1-thumb.png',
					fileSize: 10000,
					folder: DOCUMENT_FOLDER.INSURANCE,
					uploadedBy: clientId,
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date(),
					version: 1,
					contentKey,
					viewedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
				},
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Tax Document v2',
					blobName: 'tax_v2.pdf',
					thumbnailBlobName: 'tax_v2-thumb.png',
					fileSize: 15000,
					folder: DOCUMENT_FOLDER.INSURANCE,
					uploadedBy: clientId,
					createdAt: new Date('2024-01-02'),
					updatedAt: new Date(),
					version: 2,
					contentKey,
					viewedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
				},
				{
					id: faker.string.uuid(),
					clientId,
					name: 'Tax Document v3',
					blobName: 'tax_v3.pdf',
					thumbnailBlobName: 'tax_v3-thumb.png',
					fileSize: 20000,
					folder: DOCUMENT_FOLDER.INSURANCE,
					uploadedBy: clientId,
					createdAt: new Date('2024-01-03'),
					updatedAt: new Date(),
					version: 3,
					contentKey,
					viewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
				},
				{
					id: faker.string.uuid(),
					clientId,
					name: 'ID Document',
					blobName: 'id.pdf',
					thumbnailBlobName: 'id-thumb.png',
					fileSize: 12000,
					folder: DOCUMENT_FOLDER.IDENTIFICATION,
					uploadedBy: clientId,
					createdAt: new Date('2024-01-04'),
					updatedAt: new Date(),
					version: 1,
					contentKey: faker.string.uuid(),
					viewedAt: new Date(now.getTime() - 30 * 60 * 1000),
				},
			],
		})

		const response = await request(app.getHttpServer())
			.get('/recently-viewed-documents')
			.query({ folderName: 'INSURANCE' })
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(200)

		expect(response.body).toBeDefined()
		expect(response.body.documents).toHaveLength(1)
		expect(response.body.documents[0].name).toBe('Tax Document v3')
		expect(response.body.documents[0].version).toBe(3)
		expect(response.body.documents[0].folder).toBe('INSURANCE')
	})

	it('[GET] /recently-viewed-documents - should validate folderName enum', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)

		await request(app.getHttpServer())
			.get('/recently-viewed-documents')
			.query({ folderName: 'INVALID_FOLDER' })
			.set({
				// biome-ignore lint/style/useNamingConvention: <Intentional>
				Authorization: `Bearer ${jwt}`,
			})
			.expect(400)
	})
})
