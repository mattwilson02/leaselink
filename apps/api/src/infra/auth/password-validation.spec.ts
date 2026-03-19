import { validatePasswordComplexity } from './password-validation'

describe('validatePasswordComplexity', () => {
	it('should accept a valid password', () => {
		expect(() =>
			validatePasswordComplexity('MySecurePassword123!'),
		).not.toThrow()
	})

	it('should reject a password that is too short', () => {
		expect(() => validatePasswordComplexity('Aa1!')).toThrow(
			'Password must be at least 8 characters',
		)
	})

	it('should reject a password without an uppercase letter', () => {
		expect(() => validatePasswordComplexity('password123!')).toThrow(
			'Password must contain at least one uppercase letter (A-Z)',
		)
	})

	it('should reject a password without a lowercase letter', () => {
		expect(() => validatePasswordComplexity('PASSWORD123!')).toThrow(
			'Password must contain at least one lowercase letter (a-z)',
		)
	})

	it('should reject a password without a number', () => {
		expect(() => validatePasswordComplexity('MyPassword!')).toThrow(
			'Password must contain at least one number (0-9)',
		)
	})

	it('should reject a password without a special character', () => {
		expect(() => validatePasswordComplexity('MyPassword123')).toThrow(
			'Password must contain at least one special character',
		)
	})

	it('should accept passwords with special characters -~_.+', () => {
		expect(() => validatePasswordComplexity('MyPassword1-')).not.toThrow()
		expect(() => validatePasswordComplexity('MyPassword1~')).not.toThrow()
		expect(() => validatePasswordComplexity('MyPassword1_')).not.toThrow()
		expect(() => validatePasswordComplexity('MyPassword1.')).not.toThrow()
		expect(() => validatePasswordComplexity('MyPassword1+')).not.toThrow()
	})

	it('should report all errors at once', () => {
		expect(() => validatePasswordComplexity('')).toThrow(
			/at least 8 characters.*uppercase.*lowercase.*number.*special character/,
		)
	})
})
