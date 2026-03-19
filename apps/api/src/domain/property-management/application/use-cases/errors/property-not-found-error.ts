import { UseCaseError } from '@/core/errors/use-case-error'

export class PropertyNotFoundError extends Error implements UseCaseError {
	constructor(propertyId: string) {
		super(`Property with ID "${propertyId}" not found.`)
	}
}
