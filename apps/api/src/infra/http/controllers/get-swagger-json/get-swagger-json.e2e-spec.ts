import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { createTestAppModule } from 'test/utils/test-app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('GetSwaggerJsonController (E2E)', () => {
	let app: INestApplication

	beforeAll(async () => {
		const prismaClient = new PrismaService()
		const testAppModule = createTestAppModule(prismaClient)
		const moduleRef = await Test.createTestingModule({
			imports: [testAppModule],
		}).compile()

		app = moduleRef.createNestApplication()
		await app.init()
	}, 30000) // 30 second timeout for app initialization

	afterAll(async () => {
		await app.close()
	})

	it('[GET] /swagger-json', async () => {
		const filePath = join(process.cwd(), 'swagger.json')
		const swaggerJson = JSON.parse(readFileSync(filePath, 'utf-8'))

		const response = await request(app.getHttpServer())
			.get('/swagger-json')

			.expect(200)

		expect(response.body).toEqual(swaggerJson)
	})
})
