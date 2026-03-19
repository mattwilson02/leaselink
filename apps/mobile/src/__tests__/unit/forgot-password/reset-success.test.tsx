import { render, fireEvent } from '@/utils/test-utils'
import ResetSuccess from '@/app/(forgot-password)/reset-success'

const mockRouter = {
	back: jest.fn(),
	replace: jest.fn(),
	push: jest.fn(),
}

jest.mock('expo-router', () => ({
	useRouter: () => mockRouter,
}))

describe('ResetSuccess Component', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('Rendering', () => {
		it('renders successfully without crashing', () => {
			const { getByTestId } = render(<ResetSuccess />)
			expect(getByTestId('layout-safe-area-view')).toBeTruthy()
		})

		it('renders the correct heading text', () => {
			const { getByTestId } = render(<ResetSuccess />)

			const heading = getByTestId('reset-success-heading')
			expect(heading).toBeTruthy()
			expect(heading.props.children).toBe('password_reset_successful')
		})

		it('renders the login button', () => {
			const { getByTestId } = render(<ResetSuccess />)

			const loginButton = getByTestId('login-button')
			expect(loginButton).toBeTruthy()
		})
	})

	describe('Navigation', () => {
		it('navigates to sign-in screen when login button is pressed', () => {
			const { getByTestId } = render(<ResetSuccess />)

			const loginButton = getByTestId('login-button')
			fireEvent.press(loginButton)

			expect(mockRouter.replace).toHaveBeenCalledWith('/sign-in')
			expect(mockRouter.replace).toHaveBeenCalledTimes(1)
		})

		it('does not call other router methods when login button is pressed', () => {
			const { getByTestId } = render(<ResetSuccess />)

			const loginButton = getByTestId('login-button')
			fireEvent.press(loginButton)

			expect(mockRouter.back).not.toHaveBeenCalled()
			expect(mockRouter.push).not.toHaveBeenCalled()
		})
	})

	describe('Icon Configuration', () => {
		it('renders CheckCircle icon with correct props', () => {
			const { UNSAFE_getByType } = render(<ResetSuccess />)

			const checkIcon = UNSAFE_getByType(
				require('lucide-react-native').CheckCircle,
			)
			expect(checkIcon).toBeTruthy()
		})
	})
})
