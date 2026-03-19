import * as fs from 'node:fs'
import * as path from 'node:path'

interface SnippetDefinition {
	template: string
	prefix: string[]
	scope: string
	description: string
}

const snippetDefinitions: Record<string, SnippetDefinition> = {
	'Base Component': {
		template: 'component.snippet.tsx',
		prefix: ['rc', 'component'],
		scope: 'typescriptreact',
		description: 'Our standard base component',
	},
}

const templatesDir = path.join(__dirname, '../.vscode/snippets')
const snippetsFile = path.join(
	__dirname,
	'../.vscode/typescriptreact.code-snippets',
)

function buildSnippets() {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const snippets: Record<string, any> = {}

	for (const [name, definition] of Object.entries(snippetDefinitions)) {
		const templatePath = path.join(templatesDir, definition.template)
		const template = fs.readFileSync(templatePath, 'utf8')

		snippets[name] = {
			prefix: definition.prefix,
			scope: definition.scope,
			body: template.trim().split('\n'),
			description: definition.description,
		}
	}

	fs.writeFileSync(snippetsFile, JSON.stringify(snippets, null, 2))
}

buildSnippets()
