import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig(() => {
	return {
		root: '.',
		input: {
			path: 'http://localhost:3333/swagger-json',
		},
		output: {
			path: './src/gen',
			clean: true,
		},
		plugins: [
			pluginOas({
				generators: [],
				validate: true,
			}),
			pluginTs({
				output: {
					path: 'api',
				},
			}),
			pluginReactQuery({
				output: {
					path: 'api/react-query',
				},
				client: {
					importPath: '../../../services/api',
				},
			}),
		],
	}
})
