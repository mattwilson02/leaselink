import ContactUs from '@/../../app/(profile)/contact-us'
import { render, fireEvent } from '@testing-library/react-native'
import { useRouter } from 'expo-router'

jest.mock('expo-router', () => ({
	useRouter: jest.fn(),
}))

jest.mock('@/components/Icon', () => ({
	Icon: {
		Root: ({ children }: { children: React.ReactNode }) => {
			// biome-ignore lint/style/useNamingConvention: React Component
			const MockView = require('react-native').View
			return <MockView testID='icon-root'>{children}</MockView>
		},
		IconContainer: ({ children }: { children: React.ReactNode }) => {
			// biome-ignore lint/style/useNamingConvention: React Component
			const MockView = require('react-native').View
			return <MockView testID='icon-container'>{children}</MockView>
		},
		Icon: ({ name }: { name: string }) => {
			// biome-ignore lint/style/useNamingConvention: React Component
			const MockView = require('react-native').View
			return <MockView testID={`icon-${name}`} />
		},
	},
}))

describe('ContactUs Component', () => {
	const mockRouter = {
		back: jest.fn(),
		push: jest.fn(),
		replace: jest.fn(),
		setParams: jest.fn(),
	}

	beforeEach(() => {
		jest.clearAllMocks()
		;(useRouter as jest.Mock).mockReturnValue(mockRouter)
	})

	describe('Rendering', () => {
		it('should render the contact us page successfully', () => {
			const { getByText } = render(<ContactUs />)
			expect(getByText('title')).toBeTruthy()
		})

		it('should render the subtitle', () => {
			const { getByText } = render(<ContactUs />)
			expect(getByText('subtitle')).toBeTruthy()
		})

		it('should render the chat to support section', () => {
			const { getByText } = render(<ContactUs />)
			expect(getByText('chat_to_support')).toBeTruthy()
			expect(getByText('we_are_here_to_help')).toBeTruthy()
			expect(getByText('support_email')).toBeTruthy()
		})

		it('should render the call us section', () => {
			const { getByText } = render(<ContactUs />)
			expect(getByText('call_us')).toBeTruthy()
			expect(getByText('hours')).toBeTruthy()
			expect(getByText('phone_number')).toBeTruthy()
		})

		it('should render the chat icon container', () => {
			const { getAllByTestId } = render(<ContactUs />)
			const iconContainers = getAllByTestId('icon-container')
			expect(iconContainers.length).toBeGreaterThan(0)
		})

		it('should render the phone icon', () => {
			const { UNSAFE_getAllByType } = render(<ContactUs />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const Phone = require('lucide-react-native').Phone
			const phoneIcons = UNSAFE_getAllByType(Phone)
			expect(phoneIcons.length).toBe(1)
		})
	})

	describe('Navigation', () => {
		it('should navigate back when back button is pressed', () => {
			const { UNSAFE_getByType } = render(<ContactUs />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ChevronLeft = require('lucide-react-native').ChevronLeft

			const backButton = UNSAFE_getByType(ChevronLeft)
			fireEvent.press(backButton)

			expect(mockRouter.back).toHaveBeenCalledTimes(1)
		})

		it('should call router.back only once per press', () => {
			const { UNSAFE_getByType } = render(<ContactUs />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ChevronLeft = require('lucide-react-native').ChevronLeft

			const backButton = UNSAFE_getByType(ChevronLeft)
			fireEvent.press(backButton)
			fireEvent.press(backButton)

			expect(mockRouter.back).toHaveBeenCalledTimes(2)
		})

		it('should render back button with correct icon', () => {
			const { UNSAFE_getByType } = render(<ContactUs />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ChevronLeft = require('lucide-react-native').ChevronLeft

			expect(UNSAFE_getByType(ChevronLeft)).toBeTruthy()
		})
	})

	describe('Translations', () => {
		it('should use translation keys for the title', () => {
			const { getByText } = render(<ContactUs />)
			expect(getByText('title')).toBeTruthy()
		})

		it('should use translation keys for the subtitle', () => {
			const { getByText } = render(<ContactUs />)
			expect(getByText('subtitle')).toBeTruthy()
		})

		it('should use translation keys for chat to support heading', () => {
			const { getByText } = render(<ContactUs />)
			expect(getByText('chat_to_support')).toBeTruthy()
		})

		it('should use translation keys for chat to support description', () => {
			const { getByText } = render(<ContactUs />)
			expect(getByText('we_are_here_to_help')).toBeTruthy()
		})

		it('should use translation keys for support email', () => {
			const { getByText } = render(<ContactUs />)
			expect(getByText('support_email')).toBeTruthy()
		})

		it('should use translation keys for call us heading', () => {
			const { getByText } = render(<ContactUs />)
			expect(getByText('call_us')).toBeTruthy()
		})

		it('should use translation keys for hours', () => {
			const { getByText } = render(<ContactUs />)
			expect(getByText('hours')).toBeTruthy()
		})

		it('should use translation keys for phone number', () => {
			const { getByText } = render(<ContactUs />)
			expect(getByText('phone_number')).toBeTruthy()
		})
	})

	describe('Layout and Structure', () => {
		it('should render two contact cards', () => {
			const { getAllByTestId } = render(<ContactUs />)
			const iconRoots = getAllByTestId('icon-root')
			expect(iconRoots.length).toBe(2)
		})

		it('should render a ScrollView', () => {
			const { UNSAFE_getByType } = render(<ContactUs />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ScrollView = require('react-native').ScrollView
			expect(UNSAFE_getByType(ScrollView)).toBeTruthy()
		})

		it('should render the message chat icon', () => {
			const { getByTestId } = render(<ContactUs />)
			expect(getByTestId('icon-message-chat-circle')).toBeTruthy()
		})

		it('should have proper container structure', () => {
			const { UNSAFE_getAllByType } = render(<ContactUs />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const View = require('react-native').View
			const views = UNSAFE_getAllByType(View)
			expect(views.length).toBeGreaterThan(0)
		})
	})

	describe('Accessibility', () => {
		it('should render all text elements', () => {
			const { getAllByText } = render(<ContactUs />)
			expect(getAllByText(/./)).toBeTruthy()
		})

		it('should render pressable back button', () => {
			const { UNSAFE_getByType } = render(<ContactUs />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const Pressable = require('react-native').Pressable
			expect(UNSAFE_getByType(Pressable)).toBeTruthy()
		})
	})

	describe('Contact Information Display', () => {
		it('should display complete chat support information', () => {
			const { getByText } = render(<ContactUs />)
			expect(getByText('chat_to_support')).toBeTruthy()
			expect(getByText('we_are_here_to_help')).toBeTruthy()
			expect(getByText('support_email')).toBeTruthy()
		})

		it('should display complete call information', () => {
			const { getByText } = render(<ContactUs />)
			expect(getByText('call_us')).toBeTruthy()
			expect(getByText('hours')).toBeTruthy()
			expect(getByText('phone_number')).toBeTruthy()
		})
	})
})
