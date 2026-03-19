import { render, fireEvent } from '@/utils/test-utils'
import EmailVerified from '@/app/(onboarding)/email-verified'

const mockRouter = { replace: jest.fn() }
const mockTranslation = { t: jest.fn() }

describe('EmailVerified Component', () => {
	beforeEach(() => {
		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)
		jest
			.spyOn(require('react-i18next'), 'useTranslation')
			.mockReturnValue(mockTranslation)
	})

	it('navigates to confirm-mobile-number screen when button is pressed', () => {
		const { getByTestId } = render(<EmailVerified />)

		fireEvent.press(getByTestId('continue-button'))

		expect(mockRouter.replace).toHaveBeenCalledWith(
			'/(onboarding)/confirm-mobile-number',
		)
	})

	it('uses the correct translations', () => {
		render(<EmailVerified />)

		expect(mockTranslation.t).toHaveBeenCalledWith('email_verified')
		expect(mockTranslation.t).toHaveBeenCalledWith(
			'email_confirmation_successful',
		)
		expect(mockTranslation.t).toHaveBeenCalledWith('confirm_mobile_number')
		expect(mockTranslation.t).toHaveBeenCalledWith('continue')
	})

	it('has the correct styling', () => {
		const { getByTestId } = render(<EmailVerified />)

		const safeAreaView = getByTestId('email-verified-container')
		expect(safeAreaView.props.style).toEqual(
			expect.objectContaining({ backgroundColor: 'white', flex: 1 }),
		)
	})
})
