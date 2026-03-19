import { z } from 'zod'

export const PASSWORD_RULES = {
	minLength: 8,
	maxLength: 100,
	requireUppercase: /[A-Z]/,
	requireLowercase: /[a-z]/,
	requireNumber: /[0-9]/,
	requireSpecialChar: /[!@#$%^&*\-~_.+]/,
} as const

export const passwordSchema = z
	.string()
	.min(
		PASSWORD_RULES.minLength,
		`Password must be at least ${PASSWORD_RULES.minLength} characters`,
	)
	.max(
		PASSWORD_RULES.maxLength,
		`Password must be at most ${PASSWORD_RULES.maxLength} characters`,
	)
	.regex(
		PASSWORD_RULES.requireUppercase,
		'Password must contain at least one uppercase letter (A-Z)',
	)
	.regex(
		PASSWORD_RULES.requireLowercase,
		'Password must contain at least one lowercase letter (a-z)',
	)
	.regex(
		PASSWORD_RULES.requireNumber,
		'Password must contain at least one number (0-9)',
	)
	.regex(
		PASSWORD_RULES.requireSpecialChar,
		'Password must contain at least one special character (!@#$%^&*-~_.+)',
	)

export function validatePasswordComplexity(password: string): void {
	const errors: string[] = []

	if (password.length < PASSWORD_RULES.minLength) {
		errors.push(
			`Password must be at least ${PASSWORD_RULES.minLength} characters`,
		)
	}
	if (!PASSWORD_RULES.requireUppercase.test(password)) {
		errors.push('Password must contain at least one uppercase letter (A-Z)')
	}
	if (!PASSWORD_RULES.requireLowercase.test(password)) {
		errors.push('Password must contain at least one lowercase letter (a-z)')
	}
	if (!PASSWORD_RULES.requireNumber.test(password)) {
		errors.push('Password must contain at least one number (0-9)')
	}
	if (!PASSWORD_RULES.requireSpecialChar.test(password)) {
		errors.push(
			'Password must contain at least one special character (!@#$%^&*-~_.+)',
		)
	}

	if (errors.length > 0) {
		throw new Error(errors.join('. '))
	}
}
