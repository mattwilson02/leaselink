export class DocumentAlreadySignedError extends Error {
	constructor(documentId: string) {
		super(`Document '${documentId}' has already been signed.`)
		this.name = 'DocumentAlreadySignedError'
	}
}
