import { UseCaseError } from '@/core/errors/use-case-error'

export class PhoneNumberMismatchError extends Error implements UseCaseError {
	constructor() {
		super('Phone number does not match.')
	}
}
