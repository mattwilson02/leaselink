import swc from 'unplugin-swc'
import tsConfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		include: ['**/*.e2e-spec.ts'],
		globals: true,
		root: './',
		globalSetup: ['./test/global-setup-e2e.ts'],
		setupFiles: ['./test/setup-e2e.ts'],
		testTimeout: 30000, // 30 seconds for individual tests
		hookTimeout: 60000, // 60 seconds for setup/teardown hooks
	},
	plugins: [
		tsConfigPaths(),
		swc.vite({
			module: { type: 'es6' },
		}),
	],
})
