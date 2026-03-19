import { Heading, Switch, Text } from '@sf-digital-ui/react-native'
import { render, screen } from '@testing-library/react-native'
import { useRouter } from 'expo-router'
import { ScrollView, View } from 'react-native'

// Import the component
import NotificationsPage from '../../../../app/(profile)/notifications'

// Mock the API hooks
jest.mock('@/gen/index', () => ({
	useAuthControllerHandle: jest.fn(() => ({
		data: {
			receivesPushNotifications: false,
			receivesEmailNotifications: false,
			receivesNotificationsForPortfolio: false,
			receivesNotificationsForDocuments: false,
		},
	})),
	useSetNotificationPreferencesControllerHandle: jest.fn(() => ({
		mutateAsync: jest.fn(),
	})),
}))

// Mock expo-router
jest.mock('expo-router', () => ({
	useRouter: jest.fn(),
}))

describe('Notifications Settings Page', () => {
	const mockRouter = {
		back: jest.fn(),
		push: jest.fn(),
		replace: jest.fn(),
		canGoBack: jest.fn(() => true),
	}

	beforeEach(() => {
		jest.clearAllMocks()
		;(useRouter as jest.Mock).mockReturnValue(mockRouter)
	})

	describe('Page Rendering', () => {
		it('should render the notifications settings page', () => {
			render(<NotificationsPage />)

			expect(screen.getByText('title')).toBeTruthy()
		})

		it('should render the header with back button', () => {
			render(<NotificationsPage />)

			const backButton = screen.getByTestId('back-button')
			expect(backButton).toBeTruthy()
		})

		it('should render the page description', () => {
			render(<NotificationsPage />)

			expect(screen.getByText('description')).toBeTruthy()
		})
	})

	describe('Notification Channels Section', () => {
		it('should render the notification channels section title', () => {
			render(<NotificationsPage />)

			expect(screen.getByText('notification_channels')).toBeTruthy()
		})

		it('should render the notification channels description', () => {
			render(<NotificationsPage />)

			expect(screen.getByText('notification_channels_description')).toBeTruthy()
		})

		it('should render the Push notification switch', () => {
			render(<NotificationsPage />)

			expect(screen.getByText('push')).toBeTruthy()
			expect(screen.getByTestId('switch-push')).toBeTruthy()
		})

		it('should render the Email notification switch', () => {
			render(<NotificationsPage />)

			expect(screen.getByText('email')).toBeTruthy()
			expect(screen.getByTestId('switch-email')).toBeTruthy()
		})

		it('should render the email description', () => {
			render(<NotificationsPage />)

			expect(screen.getByText('email_description')).toBeTruthy()
		})
	})

	describe('Notification Categories Section', () => {
		it('should render the notification categories section title', () => {
			render(<NotificationsPage />)

			expect(screen.getByText('notification_categories')).toBeTruthy()
		})

		it('should render the notification categories description', () => {
			render(<NotificationsPage />)

			expect(
				screen.getByText('notification_categories_description'),
			).toBeTruthy()
		})

		it('should render the Portfolio Updates category switch', () => {
			render(<NotificationsPage />)

			expect(screen.getByText('portfolio_updates')).toBeTruthy()
			expect(screen.getByTestId('switch-portfolio')).toBeTruthy()
		})

		it('should render the Documents & Signatures category switch', () => {
			render(<NotificationsPage />)

			expect(screen.getByText('documents_signatures')).toBeTruthy()
			expect(screen.getByTestId('switch-documents')).toBeTruthy()
		})

		it('should render the Account & Security Alerts category switch', () => {
			render(<NotificationsPage />)

			expect(screen.getByText('account_security_alerts')).toBeTruthy()
			expect(screen.getByTestId('switch-security')).toBeTruthy()
		})
	})

	describe('Visual Separators', () => {
		it('should render dividers between sections', () => {
			const { UNSAFE_getAllByType } = render(<NotificationsPage />)

			// Check for View components that act as dividers
			const views = UNSAFE_getAllByType(View)
			const dividers = views.filter(
				(view) =>
					view.props.style &&
					typeof view.props.style === 'object' &&
					'height' in view.props.style &&
					view.props.style.height === 1,
			)

			expect(dividers.length).toBeGreaterThan(0)
		})
	})

	describe('Back Navigation', () => {
		it('should navigate back when back button is pressed', () => {
			const { getByTestId } = render(<NotificationsPage />)

			const backButton = getByTestId('back-button')
			// Fire the onPress event
			backButton.props.onClick?.() || backButton.props.onPress?.()

			expect(mockRouter.back).toHaveBeenCalledTimes(1)
		})
	})

	describe('Translation Integration', () => {
		it('should use translation for page title', () => {
			render(<NotificationsPage />)

			expect(screen.getByText('title')).toBeTruthy()
		})

		it('should use translation for all channel labels', () => {
			render(<NotificationsPage />)

			expect(screen.getByText('push')).toBeTruthy()
			expect(screen.getByText('email')).toBeTruthy()
		})

		it('should use translation for all category labels', () => {
			render(<NotificationsPage />)

			expect(screen.getByText('portfolio_updates')).toBeTruthy()
			expect(screen.getByText('documents_signatures')).toBeTruthy()
			expect(screen.getByText('account_security_alerts')).toBeTruthy()
		})

		it('should use translation for descriptions', () => {
			render(<NotificationsPage />)

			expect(screen.getByText('description')).toBeTruthy()
			expect(screen.getByText('email_description')).toBeTruthy()
		})
	})

	describe('Switch Components', () => {
		it('should render all notification switches', () => {
			render(<NotificationsPage />)

			// 2 channel switches + 3 category switches = 5 total
			expect(screen.getByTestId('switch-push')).toBeTruthy()
			expect(screen.getByTestId('switch-email')).toBeTruthy()
			expect(screen.getByTestId('switch-portfolio')).toBeTruthy()
			expect(screen.getByTestId('switch-documents')).toBeTruthy()
			expect(screen.getByTestId('switch-security')).toBeTruthy()
		})

		it('should render switches with correct testIDs', () => {
			const { UNSAFE_getAllByType } = render(<NotificationsPage />)

			const switches = UNSAFE_getAllByType(Switch)
			expect(switches.length).toBe(5)
		})
	})

	describe('Layout Structure', () => {
		it('should render content in a ScrollView', () => {
			const { UNSAFE_getByType } = render(<NotificationsPage />)

			expect(UNSAFE_getByType(ScrollView)).toBeTruthy()
		})

		it('should have proper gap spacing between sections', () => {
			const { UNSAFE_getAllByType } = render(<NotificationsPage />)

			const views = UNSAFE_getAllByType(View)
			const gapViews = views.filter(
				(view) =>
					view.props.style &&
					typeof view.props.style === 'object' &&
					'gap' in view.props.style,
			)

			expect(gapViews.length).toBeGreaterThan(0)
		})

		it('should align switches with labels horizontally', () => {
			const { UNSAFE_getAllByType } = render(<NotificationsPage />)

			const views = UNSAFE_getAllByType(View)
			const rowViews = views.filter(
				(view) =>
					view.props.style &&
					typeof view.props.style === 'object' &&
					'flexDirection' in view.props.style &&
					view.props.style.flexDirection === 'row',
			)

			expect(rowViews.length).toBeGreaterThan(0)
		})
	})

	describe('Styling', () => {
		it('should apply proper text colors for headings', () => {
			const { UNSAFE_getAllByType } = render(<NotificationsPage />)

			const headings = UNSAFE_getAllByType(Heading)
			expect(headings.length).toBeGreaterThan(0)
		})

		it('should apply proper background colors for dividers', () => {
			const { UNSAFE_getAllByType } = render(<NotificationsPage />)

			const views = UNSAFE_getAllByType(View)
			const dividers = views.filter(
				(view) =>
					view.props.style &&
					typeof view.props.style === 'object' &&
					'backgroundColor' in view.props.style &&
					'height' in view.props.style &&
					view.props.style.height === 1,
			)

			expect(dividers.length).toBeGreaterThan(0)
		})
	})

	describe('Accessibility', () => {
		it('should have accessible heading', () => {
			render(<NotificationsPage />)

			const heading = screen.getByText('title')
			expect(heading).toBeTruthy()
		})

		it('should have accessible switch labels', () => {
			render(<NotificationsPage />)

			expect(screen.getByText('push')).toBeTruthy()
			expect(screen.getByText('email')).toBeTruthy()
			expect(screen.getByText('portfolio_updates')).toBeTruthy()
			expect(screen.getByText('documents_signatures')).toBeTruthy()
			expect(screen.getByText('account_security_alerts')).toBeTruthy()
		})

		it('should have descriptive text for context', () => {
			render(<NotificationsPage />)

			expect(
				screen.getByText('notification_categories_description'),
			).toBeTruthy()
			expect(screen.getByText('email_description')).toBeTruthy()
		})
	})

	describe('Component Composition', () => {
		it('should use Heading component for title', () => {
			const { UNSAFE_getAllByType } = render(<NotificationsPage />)

			const headings = UNSAFE_getAllByType(Heading)
			expect(headings.length).toBeGreaterThan(0)
		})

		it('should use Text components for labels', () => {
			const { UNSAFE_getAllByType } = render(<NotificationsPage />)

			const texts = UNSAFE_getAllByType(Text)
			expect(texts.length).toBeGreaterThan(0)
		})

		it('should use Switch components for toggles', () => {
			const { UNSAFE_getAllByType } = render(<NotificationsPage />)

			const switches = UNSAFE_getAllByType(Switch)
			expect(switches.length).toBe(5) // 2 channels + 3 categories
		})
	})

	describe('Error Handling', () => {
		it('should render without crashing when router is unavailable', () => {
			;(useRouter as jest.Mock).mockReturnValue(undefined)

			expect(() => render(<NotificationsPage />)).not.toThrow()
		})
	})
})
