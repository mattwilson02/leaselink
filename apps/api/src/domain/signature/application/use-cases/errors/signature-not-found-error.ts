export class SignatureNotFoundError extends Error {
	constructor(documentId: string) {
		super(`Signature for document '${documentId}' not found.`)
		this.name = 'SignatureNotFoundError'
	}
}
