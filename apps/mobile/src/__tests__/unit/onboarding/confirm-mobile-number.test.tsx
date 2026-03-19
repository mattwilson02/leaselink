import { render, screen, fireEvent, waitFor } from '@/utils/test-utils'
import ConfirmMobileNumber from '@/app/(onboarding)/confirm-mobile-number'

describe('ConfirmMobileNumber Component', () => {
	const mockData = { id: 'test-user-id' }
	const mockEditClientStatus = jest.fn().mockResolvedValue({})
	const mockSendClientPhoneOtp = jest.fn()
	const mockVerifyClientPhoneOtp = jest.fn()

	beforeEach(() => {
		require('@/gen/index').useAuthControllerHandle = jest.fn().mockReturnValue({
			data: mockData,
		})

		require('@/gen/index').useEditClientControllerHandle = jest
			.fn()
			.mockReturnValue({
				mutateAsync: mockEditClientStatus,
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

		const mockRouter = {
			push: jest.fn(),
			replace: jest.fn(),
		}

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('renders initial mobile number input screen correctly', () => {
		render(<ConfirmMobileNumber />)

		expect(screen.getByTestId('confirm-email-heading')).toHaveTextContent(
			'confirm_mobile_number',
		)
		expect(screen.getByText('enter_mobile_number')).toBeTruthy()
		expect(screen.getByText('enter_to_verify')).toBeTruthy()
		expect(screen.getByText('mobile_number')).toBeTruthy()
		expect(screen.getByTestId('select-country-code')).toBeTruthy()
		expect(screen.getByText('+1')).toBeTruthy()
		expect(screen.getByText('send_verification_code')).toBeTruthy()

		expect(screen.queryByText('secure_code')).toBeFalsy()
	})

	it('validates mobile input correctly when missing fields', async () => {
		const originalConsoleError = console.error
		console.error = jest.fn()

		render(<ConfirmMobileNumber />)

		const submitButton = screen.getByText('send_verification_code')
		fireEvent.press(submitButton)

		await waitFor(() => {
			// US is selected by default, form should not call sendOtp without mobile number
			expect(mockSendClientPhoneOtp).not.toHaveBeenCalled()
		})

		console.error = originalConsoleError
	})

	it('starts mobile verification process when form is submitted', async () => {
		mockSendClientPhoneOtp.mockResolvedValue({ success: true })

		render(<ConfirmMobileNumber />)

		// US is selected by default, so we just need to enter the mobile number
		const mobileNumberInput = screen.getAllByTestId(
			'input-select-text-control',
		)[0]

		fireEvent.changeText(mobileNumberInput, '1234567890')

		const submitButton = screen.getByTestId('send-verification-code-button')
		fireEvent.press(submitButton)

		await waitFor(() => {
			expect(mockSendClientPhoneOtp).toHaveBeenCalledWith(
				{
					data: {
						phoneNumber: '+11234567890',
					},
				},
				expect.any(Object),
			)

			expect(screen.getByText('secure_code')).toBeTruthy()
			expect(screen.getByText('verify_your_number')).toBeTruthy()
			expect(screen.getByTestId('pin-input-root')).toBeTruthy()
		})
	})

	it('verifies code and redirects after successful verification', async () => {
		mockSendClientPhoneOtp.mockResolvedValue({ success: true })
		mockVerifyClientPhoneOtp.mockResolvedValue({ success: true })

		const mockRouter = {
			push: jest.fn(),
		}

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)

		render(<ConfirmMobileNumber />)

		// US is selected by default, so we just need to enter the mobile number
		const mobileNumberInput = screen.getAllByTestId(
			'input-select-text-control',
		)[0]

		fireEvent.changeText(mobileNumberInput, '1234567890')

		fireEvent.press(screen.getByTestId('send-verification-code-button'))

		await waitFor(() => {
			fireEvent(screen.getByTestId('pin-input-root'), 'complete', '123456')

			const verifyButton = screen.getByText('verify_your_number')
			fireEvent.press(verifyButton)
		})

		await waitFor(() => {
			expect(mockEditClientStatus).toHaveBeenCalledWith({
				id: 'test-user-id',
				data: {
					onboardingStatus: 'PHONE_VERIFIED',
				},
			})
			expect(mockVerifyClientPhoneOtp).toHaveBeenCalledWith(
				{
					data: {
						otp: '123456',
					},
				},
				expect.any(Object),
			)
			expect(mockRouter.push).toHaveBeenCalledWith(
				'/(onboarding)/mobile-verified',
			)
		})
	})

	it('handles phone number verification error gracefully', async () => {
		const originalConsoleError = console.error
		console.error = jest.fn()
		mockSendClientPhoneOtp.mockResolvedValue({ success: true })
		mockVerifyClientPhoneOtp.mockRejectedValue(
			new Error('Verification code failed'),
		)

		render(<ConfirmMobileNumber />)

		// US is selected by default, so we just need to enter the mobile number
		const mobileNumberInput = screen.getAllByTestId(
			'input-select-text-control',
		)[0]

		fireEvent.changeText(mobileNumberInput, '1234567890')

		fireEvent.press(screen.getByText('send_verification_code'))

		await waitFor(() => {
			fireEvent(screen.getByTestId('pin-input-root'), 'complete', '123456')

			const verifyButton = screen.getByText('verify_your_number')
			fireEvent.press(verifyButton)
		})

		await waitFor(() => {
			expect(mockEditClientStatus).not.toHaveBeenCalled()
			expect(console.error).toHaveBeenCalledWith(
				'Verification code failed',
				new Error('Verification code failed'),
			)
		})

		console.error = originalConsoleError
	})

	it('automatically verifies code when 6th digit is entered', async () => {
		mockSendClientPhoneOtp.mockResolvedValue({ success: true })
		mockVerifyClientPhoneOtp.mockResolvedValue({ success: true })

		const mockRouter = {
			push: jest.fn(),
		}

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)

		render(<ConfirmMobileNumber />)

		const mobileNumberInput = screen.getAllByTestId(
			'input-select-text-control',
		)[0]

		fireEvent.changeText(mobileNumberInput, '1234567890')
		fireEvent.press(screen.getByTestId('send-verification-code-button'))

		await waitFor(() => {
			expect(screen.getByText('secure_code')).toBeTruthy()
		})

		// Simulate completing the PIN input - should auto-verify
		fireEvent(screen.getByTestId('pin-input-root'), 'complete', '123456')

		// Should automatically verify without pressing the button
		await waitFor(() => {
			expect(mockVerifyClientPhoneOtp).toHaveBeenCalledWith(
				{
					data: {
						otp: '123456',
					},
				},
				expect.any(Object),
			)

			expect(mockRouter.push).toHaveBeenCalledWith(
				'/(onboarding)/mobile-verified',
			)
		})
	})

	it('shows error modal when auto-verification fails', async () => {
		const originalConsoleError = console.error
		console.error = jest.fn()
		mockSendClientPhoneOtp.mockResolvedValue({ success: true })
		mockVerifyClientPhoneOtp.mockRejectedValue(
			new Error('Invalid verification code'),
		)

		render(<ConfirmMobileNumber />)

		const mobileNumberInput = screen.getAllByTestId(
			'input-select-text-control',
		)[0]

		fireEvent.changeText(mobileNumberInput, '1234567890')
		fireEvent.press(screen.getByTestId('send-verification-code-button'))

		await waitFor(() => {
			expect(screen.getByText('secure_code')).toBeTruthy()
		})

		// Complete the PIN to trigger auto-verification
		fireEvent(screen.getByTestId('pin-input-root'), 'complete', '654321')

		// Should show error modal with the error message
		await waitFor(() => {
			expect(mockVerifyClientPhoneOtp).toHaveBeenCalledWith(
				{
					data: {
						otp: '654321',
					},
				},
				expect.any(Object),
			)
			expect(screen.getByText('Invalid verification code')).toBeTruthy()
		})

		console.error = originalConsoleError
	})

	it('does not redirect when auto-verification returns success false', async () => {
		mockSendClientPhoneOtp.mockResolvedValue({ success: true })
		mockVerifyClientPhoneOtp.mockResolvedValue({ success: false })

		const mockRouter = {
			push: jest.fn(),
		}

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)

		render(<ConfirmMobileNumber />)

		const mobileNumberInput = screen.getAllByTestId(
			'input-select-text-control',
		)[0]

		fireEvent.changeText(mobileNumberInput, '1234567890')
		fireEvent.press(screen.getByTestId('send-verification-code-button'))

		await waitFor(() => {
			expect(screen.getByText('secure_code')).toBeTruthy()
		})

		// Complete the PIN to trigger auto-verification
		fireEvent(screen.getByTestId('pin-input-root'), 'complete', '123456')

		await waitFor(() => {
			expect(mockVerifyClientPhoneOtp).toHaveBeenCalled()
		})

		// Should not redirect
		expect(mockRouter.push).not.toHaveBeenCalled()
	})
})
