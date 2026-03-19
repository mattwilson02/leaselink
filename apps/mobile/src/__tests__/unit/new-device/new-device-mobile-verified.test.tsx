import { render, fireEvent } from '@/utils/test-utils'
import MobileVerified from '@/app/(new-device)/mobile-verified'

const mockRouter = { replace: jest.fn() }
const mockTranslation = { t: jest.fn() }

describe('MobileVerified Component', () => {
	beforeEach(() => {
		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)
		jest
			.spyOn(require('react-i18next'), 'useTranslation')
			.mockReturnValue(mockTranslation)
		jest.spyOn(require('expo-router'), 'useLocalSearchParams').mockReturnValue({
			password: 'test-password',
		})
	})

	it('navigates to set-password screen when button is pressed', () => {
		const { getByTestId } = render(<MobileVerified />)

		fireEvent.press(getByTestId('continue-button'))

		expect(mockRouter.replace).toHaveBeenCalledWith({
			params: { password: 'test-password' },
			pathname: '/(new-device)/switch-device-confirm',
		})
	})

	it('uses the correct translations', () => {
		render(<MobileVerified />)

		expect(mockTranslation.t).toHaveBeenCalledWith('mobile_verified')
		expect(mockTranslation.t).toHaveBeenCalledWith(
			'mobile_confirmation_successful',
		)
		expect(mockTranslation.t).toHaveBeenCalledWith('continue')
	})

	it('has the correct styling', () => {
		const { getByTestId } = render(<MobileVerified />)

		const safeAreaView = getByTestId('mobile-verified-container')
		expect(safeAreaView.props.style).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ backgroundColor: 'white', flex: 1 }),
			]),
		)
	})
})
