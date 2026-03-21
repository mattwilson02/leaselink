export class DocumentNotSignableError extends Error {
	constructor(folder: string) {
		super(`Document in folder '${folder}' is not eligible for signing.`)
		this.name = 'DocumentNotSignableError'
	}
}
