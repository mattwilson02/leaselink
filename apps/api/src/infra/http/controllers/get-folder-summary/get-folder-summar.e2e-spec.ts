import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvModule } from '@/infra/env/env.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtFactory } from 'test/factories/make-valid-jwt-factory'
import { BetterAuthModule } from '@/infra/auth/better-auth/better-auth.module'
import { authUserClientIdE2E } from 'test/utils/auth-user-id-e2e'
import { createTestAppModule } from 'test/utils/test-app.module'

describe('GetDocumentFolderSummaryController (E2E)', () => {
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

	it('[GET] /documents/folder-summary - should return 401 if user is not authenticated', async () => {
		await request(app.getHttpServer())
			.get('/documents/folder-summary')
			.expect(401)
	})

	it('[GET] /documents/folder-summary - should return 200 with empty array if no documents are found', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)
		const clientAuth = await prisma.identityProvider.findFirst({
			where: { providerUserId: authUserClientIdE2E },
		})
		if (!clientAuth?.userId) throw new Error('Client user ID not found')
		await prisma.document.deleteMany({ where: { clientId: clientAuth.userId } })
		const response = await request(app.getHttpServer())
			.get('/documents/folder-summary')
			// biome-ignore lint/style/useNamingConvention: <Biome doesn't like capitals in headers>
			.set({ Authorization: `Bearer ${jwt}` })
			.expect(200)
		expect(response.body).toEqual({ documentsByFolder: [] })
	})

	it('[GET] /documents/folder-summary - should return 200 and folder summary if documents exist', async () => {
		const { jwt } = await jwtFactory.makeJwt(true)
		const clientAuth = await prisma.identityProvider.findFirst({
			where: { providerUserId: authUserClientIdE2E },
		})
		if (!clientAuth?.userId) throw new Error('Client user ID not found')
		// Clean up and seed a document for the client
		await prisma.document.deleteMany({ where: { clientId: clientAuth.userId } })
		const folder = 'IDENTIFICATION' as const
		await prisma.document.create({
			data: {
				clientId: clientAuth.userId,
				folder,
				name: 'Test Document',
				contentKey: 'dummy-content-key',
				blobName: 'dummy-blob-name',
				fileSize: 1234,
				uploadedBy: clientAuth.userId,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		})
		const response = await request(app.getHttpServer())
			.get('/documents/folder-summary')
			// biome-ignore lint/style/useNamingConvention: <Auth Header>
			.set({ Authorization: `Bearer ${jwt}` })
			.expect(200)
		expect(response.body).toHaveProperty('documentsByFolder')
		expect(Array.isArray(response.body.documentsByFolder)).toBe(true)
		const folderSummary = response.body.documentsByFolder.find(
			(f: { folderName: string }) => f.folderName === folder,
		)
		expect(folderSummary).toBeDefined()
		expect(folderSummary.fileCount).toBe(1)
		expect(typeof folderSummary.totalFileSizeSum).toBe('number')
		expect(folderSummary.mostRecentUpdatedDate).toBeTruthy()
	})
})
