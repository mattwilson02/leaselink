import { render, fireEvent } from '@/utils/test-utils'
import EmailVerified from '@/app/(new-device)/email-verified'

const mockRouter = { replace: jest.fn() }
const mockTranslation = { t: jest.fn() }

describe('EmailVerified Component', () => {
	beforeEach(() => {
		jest.spyOn(require('expo-router'), 'useLocalSearchParams').mockReturnValue({
			password: 'test-password',
		})

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)
		jest
			.spyOn(require('react-i18next'), 'useTranslation')
			.mockReturnValue(mockTranslation)
	})

	it('navigates to confirm-mobile-number screen when button is pressed', () => {
		const { getByTestId } = render(<EmailVerified />)

		fireEvent.press(getByTestId('continue-button'))

		expect(mockRouter.replace).toHaveBeenCalledWith({
			params: { password: 'test-password' },
			pathname: '/(new-device)/confirm-mobile-number',
		})
	})

	it('uses the correct translations', () => {
		render(<EmailVerified />)

		expect(mockTranslation.t).toHaveBeenCalledWith('email_verified')
		expect(mockTranslation.t).toHaveBeenCalledWith(
			'email_confirmation_successful',
		)
		expect(mockTranslation.t).toHaveBeenCalledWith('continue')
	})
})
