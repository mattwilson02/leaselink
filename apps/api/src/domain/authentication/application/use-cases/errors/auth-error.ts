export class AuthError extends Error {
	// biome-ignore lint/suspicious/noExplicitAny: <This is fine>
	constructor(public readonly details: any) {
		const message = AuthError.formatErrorMessage(details)

		super(message)
		this.name = 'AuthError'
	}

	// biome-ignore lint/suspicious/noExplicitAny: <This is fine>
	private static formatErrorMessage(details: any): string {
		if (!details || !Array.isArray(details.errors)) {
			return 'An unknown error occurred while creating a users auth.'
		}

		return (
			details.errors
				// biome-ignore lint/suspicious/noExplicitAny: <This is fine>
				.map((error: any) => error.message || 'Unknown error')
				.join('; ')
		)
	}

	// biome-ignore lint/suspicious/noExplicitAny: <This is fine>
	getOriginalError(): any {
		return this.details
	}
}
