import { render, fireEvent, waitFor } from '@/utils/test-utils'
import TooManyAttempts from '@/app/(onboarding)/too-many-attempts'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { FAILED_ATTEMPTS_KEY } from '@/hooks/useFailedAttempts'

describe('TooManyAttempts Component', () => {
	const mockPush = jest.fn()
	const mockRemoveItem = jest.fn(() => Promise.resolve())

	beforeEach(() => {
		jest.clearAllMocks()

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue({
			push: mockPush,
		})

		AsyncStorage.removeItem = mockRemoveItem
	})

	it('renders correctly with all text elements', async () => {
		const { getByTestId } = render(<TooManyAttempts />)

		await waitFor(() => {
			expect(getByTestId('error-heading')).toBeTruthy()
			expect(getByTestId('error-message')).toBeTruthy()
			expect(getByTestId('security-lock')).toBeTruthy()
			expect(getByTestId('contact-manager')).toBeTruthy()
			expect(getByTestId('reset-button')).toBeTruthy()
			expect(getByTestId('back-button')).toBeTruthy()
		})
	})

	it('clicking "Reset Attempts" button removes failed attempts from AsyncStorage and navigates home', async () => {
		const { getByTestId } = render(<TooManyAttempts />)

		const resetButton = getByTestId('reset-button')
		fireEvent.press(resetButton)

		await waitFor(() => {
			expect(mockRemoveItem).toHaveBeenCalledWith(FAILED_ATTEMPTS_KEY)
			expect(mockPush).toHaveBeenCalledWith('/')
		})
	})

	it('handles AsyncStorage errors when resetting attempts', async () => {
		const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

		AsyncStorage.removeItem = jest.fn(() =>
			Promise.reject(new Error('Storage error')),
		)

		const { getByTestId } = render(<TooManyAttempts />)

		const resetButton = getByTestId('reset-button')
		fireEvent.press(resetButton)

		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith(
				'Error resetting failed attempts:',
				expect.any(Error),
			)
			expect(mockPush).not.toHaveBeenCalled()
		})

		consoleSpy.mockRestore()
	})
})
