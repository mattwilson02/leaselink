/**
 * Extracts error messages from TanStack Form validation errors
 * @param errors Array of validation error objects
 * @param firstOnly If true, returns only the first error message
 * @returns Comma-separated string of error messages or just the first error
 */
export const extractErrorMessages = (
	errors: unknown[],
	firstOnly = false,
): string => {
	if (!errors || errors.length === 0) return ''

	const errorMessages = errors.map((error) => {
		// Handle zod validation errors which have a message property
		if (typeof error === 'object' && error !== null && 'message' in error) {
			return (error as { message: string }).message
		}
		// Handle string errors
		if (typeof error === 'string') {
			return error
		}
		// Fallback for other types
		return String(error)
	})

	return firstOnly ? errorMessages[0] || '' : errorMessages.join(', ')
}
