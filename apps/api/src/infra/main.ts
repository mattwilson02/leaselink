import { NestFactory } from '@nestjs/core'

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { EnvService } from './env/env.service'

declare global {
	interface Window {
		ui: {
			preauthorizeApiKey: (key: string, token: string) => void
		}
	}
}

interface SwaggerResponse {
	url: string
	obj?: {
		token?: string
		[key: string]: unknown
	}
	[key: string]: unknown
}

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bodyParser: false, // Disable the default body parser to use raw body for betterAuth
		rawBody: true, // Enable raw body for Stripe webhook signature verification
	})

	const config = new DocumentBuilder()
		.setTitle('Mobile API')
		.setDescription('Auto-generated API docs with Swagger')
		.setVersion('1.0')
		.addBearerAuth()
		.build()

	const envService = app.get(EnvService)
	const port = envService.get('PORT')
	const isDev = envService.get('NODE_ENV') === 'development'

	if (isDev) {
		// TODO: Remove this
		app.enableCors({
			origin: ['http://localhost:3000', 'http://localhost:3003'], // Testing frontend URL
			credentials: true, // Allow credentials (cookies, authorization headers, etc.)
			methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
			allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
		})
	} else {
		app.enableCors() // In production, enable CORS with default settings or configure as needed
	}

	const document = SwaggerModule.createDocument(app, config)

	const outputPath = join(process.cwd(), 'swagger.json')

	if (isDev) {
		const outputPath = join(process.cwd(), 'swagger.json')
		writeFileSync(outputPath, JSON.stringify(document, null, 2), {
			encoding: 'utf8',
		})
		// biome-ignore lint/suspicious/noConsole: This is a dev-only log
		console.log(`Swagger documentation generated at ${outputPath}`)
	}

	SwaggerModule.setup('api/docs', app, document, {
		swaggerOptions: {
			persistAuthorization: true,
			tagsSorter: 'alpha',
			responseInterceptor: (res: SwaggerResponse) => {
				if (
					res.url.match(/\/token\/generate\/(employee|client)$/) &&
					res.obj?.token
				) {
					const token = res.obj.token
					window.ui.preauthorizeApiKey('bearer', token)
				}
				return res
			},
		},
	})

	await app.listen(port)
	// biome-ignore lint/suspicious/noConsole: This is a dev-only log
	console.log(`Swagger documentation generated at ${outputPath}`)
}

bootstrap()
