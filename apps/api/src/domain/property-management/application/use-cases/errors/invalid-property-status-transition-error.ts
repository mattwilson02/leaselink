import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidPropertyStatusTransitionError
	extends Error
	implements UseCaseError
{
	constructor(from: string, to: string) {
		super(`Invalid property status transition from "${from}" to "${to}".`)
	}
}
