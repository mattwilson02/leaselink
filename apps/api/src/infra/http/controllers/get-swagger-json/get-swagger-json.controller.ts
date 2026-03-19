import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Public } from '@thallesp/nestjs-better-auth'
import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

let cachedSwaggerJson: unknown = null

@ApiTags('Swagger')
@Controller('/swagger-json')
@Public()
export class GetSwaggerJsonController {
	@Get()
	@ApiOperation({
		summary: 'Get Swagger JSON',
		description: 'Get the Swagger JSON configuration',
	})
	@ApiResponse({
		status: 200,
		description: 'Returns the Swagger JSON configuration',
		type: Object,
	})
	async handle() {
		try {
			if (!cachedSwaggerJson) {
				const filePath = join(process.cwd(), 'swagger.json')
				cachedSwaggerJson = JSON.parse(readFileSync(filePath, 'utf-8'))
			}
			return cachedSwaggerJson
		} catch (error) {
			console.error('Error loading Swagger JSON:', error)
			throw new Error('Swagger JSON file not found')
		}
	}
}
