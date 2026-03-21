export class SignatureImageNotFoundError extends Error {
	constructor(blobKey: string) {
		super(`Signature image '${blobKey}' not found in storage.`)
		this.name = 'SignatureImageNotFoundError'
	}
}
