import 'dotenv/config'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { DomainEvents } from '@/core/events/domain-events'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set')
}

const generateUniqueDataBaseURL = (schemaId: string) => {
	if (!process.env.DATABASE_URL) {
		throw new Error('DATABASE_URL is not set')
	}

	const url = new URL(process.env.DATABASE_URL)

	url.searchParams.set('schema', schemaId)

	return url.toString()
}

const schemaId = randomUUID()

beforeAll(async () => {
	// eslint-disable-next-line no-console
	console.time('E2E Setup - Total time')

	const databaseUrl = generateUniqueDataBaseURL(schemaId)

	process.env.DATABASE_URL = databaseUrl

	DomainEvents.shouldRun = false

	try {
		execSync('npx prisma migrate deploy', { stdio: 'pipe' })

		execSync('npx prisma db seed', { stdio: 'pipe' })
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error during E2E setup:', error)
		throw error
	}
}, 60000) // 60 second timeout for setup

afterAll(async () => {
	try {
		await prisma.$executeRawUnsafe(
			`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`,
		)
	} catch (error) {
		console.error('Error during E2E cleanup:', error)
	} finally {
		await prisma.$disconnect()
	}
}, 15000) // 15 second timeout for cleanup
