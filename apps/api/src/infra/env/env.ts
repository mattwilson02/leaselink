import { z } from 'zod'

export const envSchema = z.object({
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	PORT: z.coerce.number().optional().default(3333),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	DATABASE_URL: z.string(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	BLOB_STORAGE_ACCOUNT_NAME: z.string(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	BLOB_STORAGE_ACCOUNT_KEY: z.string(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	BLOB_STORAGE_CONTAINER_NAME: z.string(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	BLOB_STORAGE_ENDPOINT: z.string(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	BLOB_STORAGE_CONNECTION_STRING: z.string(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	TWILIO_ACCOUNT_SID: z.string(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	TWILIO_AUTH_TOKEN: z.string(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	TWILIO_PHONE_NUMBER: z.string(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	SMTP_HOST: z.string(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	SMTP_PORT: z.coerce.number(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	SMTP_USER: z.string(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	SMTP_PASSWORD: z.string(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	SMTP_FROM_EMAIL: z.string(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	APP_NAME: z.string(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	AZURE_AD_CLIENT_ID: z.string(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	AZURE_AD_CLIENT_SECRET: z.string(),
	// biome-ignore lint/style/useNamingConvention: env variables should be in uppercase
	AZURE_AD_TENANT_ID: z.string(),
})

export type Env = z.infer<typeof envSchema>
