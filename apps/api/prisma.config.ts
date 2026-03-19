import { config } from 'dotenv'
import { defineConfig, PrismaConfig } from 'prisma/config'

config({ path: '.env.local' }) // We run config here to provide access to the DATABASE_URL env variable

export default defineConfig({
	migrations: {
		seed: 'ts-node prisma/seed.ts',
	},
} satisfies PrismaConfig)
