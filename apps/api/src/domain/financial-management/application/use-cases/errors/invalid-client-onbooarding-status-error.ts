export class InvalidClientOnboardingStatusError extends Error {
	constructor(status: string) {
		super(`The client  onboarding status "${status}" is invalid.`)
	}
}
