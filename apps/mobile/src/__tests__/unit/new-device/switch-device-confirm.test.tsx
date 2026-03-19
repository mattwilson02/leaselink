import { render, fireEvent } from '@/utils/test-utils'
import SwitchDeviceConfirm from '@/app/(new-device)/switch-device-confirm'

const mockRouter = { replace: jest.fn() }

describe('SwitchDeviceConfirm Component', () => {
	beforeEach(() => {
		jest.spyOn(require('expo-router'), 'useLocalSearchParams').mockReturnValue({
			password: 'test-password',
		})

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)
	})

	it('navigates to enable-biometrics screen when continue button is pressed', () => {
		const { getByTestId, getByText } = render(<SwitchDeviceConfirm />)

		expect(getByTestId('switch-device-confirm-container')).toBeTruthy()

		fireEvent.press(getByText('continue'))

		expect(mockRouter.replace).toHaveBeenCalledWith({
			params: { password: 'test-password' },
			pathname: '/(new-device)/enable-biometrics',
		})
	})

	it('navigates to sign-in screen when cancel button is pressed', () => {
		const { getByTestId, getByText } = render(<SwitchDeviceConfirm />)

		expect(getByTestId('switch-device-confirm-container')).toBeTruthy()

		fireEvent.press(getByText('cancel'))

		expect(mockRouter.replace).toHaveBeenCalledWith('/sign-in')
	})

	it('uses the correct translations', () => {
		const { getByText } = render(<SwitchDeviceConfirm />)

		expect(getByText('device_switch_confirmation')).toBeTruthy()
		expect(getByText('switch_device_description')).toBeTruthy()
		expect(getByText('continue')).toBeTruthy()
		expect(getByText('cancel')).toBeTruthy()
	})
})
