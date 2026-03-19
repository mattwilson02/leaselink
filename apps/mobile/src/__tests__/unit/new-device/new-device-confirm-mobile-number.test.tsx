import { render, screen, fireEvent, waitFor } from '@/utils/test-utils'
import ConfirmMobileNumber from '@/app/(new-device)/confirm-mobile-number'

describe('ConfirmMobileNumber Component', () => {
	const mockRouter = {
		back: jest.fn(),
		replace: jest.fn(),
		push: jest.fn(),
	}
	const mockSendClientPhoneOtp = jest.fn()
	const mockVerifyClientPhoneOtp = jest.fn()
	const mockData = { phoneNumber: '+1234567890' }

	beforeEach(() => {
		jest.spyOn(require('expo-router'), 'useLocalSearchParams').mockReturnValue({
			password: 'test-password',
		})

		require('@/gen/index').useAuthControllerHandle = jest.fn().mockReturnValue({
			data: mockData,
		})

		require('@/gen/index').useSendClientPhoneOtpControllerHandle = jest
			.fn()
			.mockReturnValue({
				mutateAsync: mockSendClientPhoneOtp,
			})

		require('@/gen/index').useVerifyPhoneNumberOtpControllerHandle = jest
			.fn()
			.mockReturnValue({
				mutateAsync: mockVerifyClientPhoneOtp,
			})

		mockSendClientPhoneOtp.mockResolvedValue({ success: true })

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)

		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.clearAllMocks()
		jest.useRealTimers()
	})

	it('renders screen correctly', () => {
		render(<ConfirmMobileNumber />)

		expect(screen.getByText('confirm_mobile_number')).toBeTruthy()
		expect(screen.getByText('we_sent_code_to')).toBeTruthy()
		expect(screen.getByText('+1234567890')).toBeTruthy()
		expect(screen.getByText('enter_to_verify')).toBeTruthy()
		expect(screen.getByText('secure_code')).toBeTruthy()
		expect(screen.getByText('didnt_receive_code')).toBeTruthy()
		expect(screen.getByText('resend_code')).toBeTruthy()
		expect(screen.getByText('verify_your_number')).toBeTruthy()
	})

	it('handles verify code button press successfully', async () => {
		mockVerifyClientPhoneOtp.mockResolvedValue({ success: true })

		render(<ConfirmMobileNumber />)

		fireEvent(screen.getByTestId('pin-input-root'), 'complete', '123456')

		const verifyButton = screen.getByText('verify_your_number')
		fireEvent.press(verifyButton)

		await waitFor(() => {
			expect(mockVerifyClientPhoneOtp).toHaveBeenCalledWith({
				data: {
					otp: '123456',
				},
			})

			expect(mockRouter.push).toHaveBeenCalledWith({
				pathname: '/(new-device)/mobile-verified',
				params: { password: 'test-password' },
			})
		})
	})

	it('handles verify code API error', async () => {
		const mockError = new Error('Verification failed')
		mockVerifyClientPhoneOtp.mockRejectedValue(mockError)

		render(<ConfirmMobileNumber />)

		fireEvent(screen.getByTestId('pin-input-root'), 'complete', '123456')

		await waitFor(() => {
			expect(screen.getByText('Verification failed')).toBeTruthy()
		})
	})

	it('handles resend code button press successfully', async () => {
		mockSendClientPhoneOtp.mockResolvedValue({ success: true })

		render(<ConfirmMobileNumber />)

		const resendButton = screen.getByTestId('resend-code-button')
		fireEvent.press(resendButton)

		await waitFor(() => {
			expect(mockSendClientPhoneOtp).toHaveBeenCalledWith({
				data: {},
			})
			expect(screen.getByText('resend_code (10s)')).toBeTruthy()
		})
	})

	it('disables resend button and shows countdown after resend', async () => {
		render(<ConfirmMobileNumber />)

		const resendButton = screen.getByTestId('resend-code-button')
		fireEvent.press(resendButton)

		await waitFor(() => {
			expect(screen.getByText('resend_code (10s)')).toBeTruthy()
		})
	})

	it('does not resend code when resend is disabled', async () => {
		mockSendClientPhoneOtp.mockResolvedValue({ success: true })

		render(<ConfirmMobileNumber />)

		const resendButton = screen.getByTestId('resend-code-button')

		fireEvent.press(resendButton)

		await waitFor(() => {
			expect(mockSendClientPhoneOtp).toHaveBeenCalledWith({
				data: {},
			})

			// Called twice: once on mount, once on resend
			expect(mockSendClientPhoneOtp).toHaveBeenCalledTimes(2)
		})

		fireEvent.press(resendButton)

		await waitFor(() => {
			// Should still be 2, not 3
			expect(mockSendClientPhoneOtp).toHaveBeenCalledTimes(2)
		})
	})

	it('handles resend code API error', async () => {
		const mockError = new Error('Resend failed')
		mockSendClientPhoneOtp.mockRejectedValue(mockError)

		render(<ConfirmMobileNumber />)

		const resendButton = screen.getByTestId('resend-code-button')
		fireEvent.press(resendButton)

		await waitFor(() => {
			expect(screen.getByText('Resend failed')).toBeTruthy()
		})
	})

	it('clears timer on component unmount', () => {
		const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

		const { unmount } = render(<ConfirmMobileNumber />)

		const resendButton = screen.getByTestId('resend-code-button')
		fireEvent.press(resendButton)

		unmount()

		expect(clearTimeoutSpy).toHaveBeenCalled()
	})

	it('displays phone number correctly when available', () => {
		render(<ConfirmMobileNumber />)
		expect(screen.getByText('+1234567890')).toBeTruthy()
	})

	it('automatically verifies code when 6th digit is entered', async () => {
		mockVerifyClientPhoneOtp.mockResolvedValue({ success: true })

		render(<ConfirmMobileNumber />)

		// Simulate completing the PIN input
		fireEvent(screen.getByTestId('pin-input-root'), 'complete', '123456')

		// Should automatically verify without pressing the button
		await waitFor(() => {
			expect(mockVerifyClientPhoneOtp).toHaveBeenCalledWith({
				data: {
					otp: '123456',
				},
			})

			expect(mockRouter.push).toHaveBeenCalledWith({
				pathname: '/(new-device)/mobile-verified',
				params: { password: 'test-password' },
			})
		})
	})

	it('shows error modal when auto-verification fails', async () => {
		mockVerifyClientPhoneOtp.mockRejectedValue(
			new Error('Invalid verification code'),
		)

		render(<ConfirmMobileNumber />)

		// Complete the PIN to trigger auto-verification
		fireEvent(screen.getByTestId('pin-input-root'), 'complete', '654321')

		// Should show error modal with the error message
		await waitFor(() => {
			expect(mockVerifyClientPhoneOtp).toHaveBeenCalledWith({
				data: {
					otp: '654321',
				},
			})
			expect(screen.getByText('Invalid verification code')).toBeTruthy()
		})
	})

	it('does not redirect when auto-verification returns success false', async () => {
		mockVerifyClientPhoneOtp.mockResolvedValue({ success: false })

		render(<ConfirmMobileNumber />)

		// Complete the PIN to trigger auto-verification
		fireEvent(screen.getByTestId('pin-input-root'), 'complete', '123456')

		await waitFor(() => {
			expect(mockVerifyClientPhoneOtp).toHaveBeenCalled()
		})

		// Should not redirect
		expect(mockRouter.push).not.toHaveBeenCalled()
	})
})
