export class InvalidClientStatusError extends Error {
	constructor(status: string) {
		super(`The client status "${status}" is invalid.`)
	}
}
