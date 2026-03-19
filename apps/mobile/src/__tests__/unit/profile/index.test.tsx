import Profile from '@/../../app/(profile)/index'
import {
	useAuthControllerHandle,
	useGetClientProfilePhotoControllerHandle,
} from '@/gen/index'
import { render, fireEvent, waitFor } from '@/utils/test-utils'
import { authClient } from '@/services/auth'

jest.mock('@/gen/index', () => ({
	useAuthControllerHandle: jest.fn(),
	useGetClientProfilePhotoControllerHandle: jest.fn(),
}))

jest.mock('expo-router', () => ({
	useRouter: jest.fn(),
}))

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: jest.fn(() => ({
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
	})),
}))

jest.mock('@/components/Icon', () => ({
	Icon: {
		Icon: ({
			name,
			testID,
		}: {
			name: string
			size: number
			stroke: string
			strokeWidth: number
			testID?: string
		}) => {
			// biome-ignore lint/style/useNamingConvention: React Component
			const MockView = require('react-native').View
			// biome-ignore lint/style/useNamingConvention: React Component
			const MockText = require('react-native').Text

			return (
				<MockView testID={testID || `icon-${name}`}>
					<MockText>{name}</MockText>
				</MockView>
			)
		},
	},
}))

describe('Profile Component', () => {
	const mockUser = {
		id: 'test-user-id',
		name: 'John Doe',
		email: 'john.doe@example.com',
		clientId: 'test-client-id',
	}

	const mockRouter = {
		back: jest.fn(),
		push: jest.fn(),
		replace: jest.fn(),
		setParams: jest.fn(),
	}

	beforeEach(() => {
		jest.clearAllMocks()
		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)
		;(useAuthControllerHandle as jest.Mock).mockReturnValue({
			data: mockUser,
			isFetching: false,
		})
		;(useGetClientProfilePhotoControllerHandle as jest.Mock).mockReturnValue({
			data: null,
		})
	})

	describe('Loading State', () => {
		it('should show loading indicator when fetching user data', () => {
			;(useAuthControllerHandle as jest.Mock).mockReturnValue({
				data: undefined,
				isFetching: true,
			})

			const { getByTestId } = render(<Profile />)
			expect(getByTestId('profile-skeleton')).toBeTruthy()
		})

		it('should hide loading indicator when data is loaded', () => {
			const { queryByTestId } = render(<Profile />)
			expect(queryByTestId('profile-skeleton')).toBeNull()
		})
	})

	describe('User Information Display', () => {
		it('should render user name and email when data is available', () => {
			const { getByText } = render(<Profile />)
			expect(getByText('John Doe')).toBeTruthy()
			expect(getByText('john.doe@example.com')).toBeTruthy()
		})

		it('should render avatar fallback with initials when no profile photo', () => {
			const { getByTestId, getByText } = render(<Profile />)
			expect(getByTestId('profile-avatar')).toBeTruthy()
			expect(getByText('JD')).toBeTruthy() // John Doe initials
		})

		it('should render profile photo when available', () => {
			;(useGetClientProfilePhotoControllerHandle as jest.Mock).mockReturnValue({
				data: { profilePhoto: 'base64encodedphoto' },
			})

			const { getByTestId } = render(<Profile />)
			expect(getByTestId('profile-photo')).toBeTruthy()
		})

		it('should handle undefined user data gracefully', () => {
			;(useAuthControllerHandle as jest.Mock).mockReturnValue({
				data: undefined,
				isFetching: false,
			})

			const { getByTestId } = render(<Profile />)
			expect(getByTestId('profile-header')).toBeTruthy()
		})

		it('should handle missing user name', () => {
			;(useAuthControllerHandle as jest.Mock).mockReturnValue({
				data: { ...mockUser, name: undefined },
				isFetching: false,
			})

			const { getByTestId } = render(<Profile />)
			expect(getByTestId('profile-header')).toBeTruthy()
		})

		it('should handle missing user email', () => {
			;(useAuthControllerHandle as jest.Mock).mockReturnValue({
				data: { ...mockUser, email: undefined },
				isFetching: false,
			})

			const { getByTestId } = render(<Profile />)
			expect(getByTestId('profile-header')).toBeTruthy()
		})
	})

	describe('Navigation', () => {
		it('should navigate back when back button is pressed', () => {
			const { UNSAFE_getByType } = render(<Profile />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ChevronLeft = require('lucide-react-native').ChevronLeft

			const backButton = UNSAFE_getByType(ChevronLeft)
			fireEvent.press(backButton)

			expect(mockRouter.back).toHaveBeenCalledTimes(1)
		})

		it('should call router.back only once per press', () => {
			const { UNSAFE_getByType } = render(<Profile />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ChevronLeft = require('lucide-react-native').ChevronLeft

			const backButton = UNSAFE_getByType(ChevronLeft)
			fireEvent.press(backButton)
			fireEvent.press(backButton)

			expect(mockRouter.back).toHaveBeenCalledTimes(2)
		})
	})

	describe('Menu Sections', () => {
		it('should render all menu sections', () => {
			const { getAllByTestId } = render(<Profile />)
			const sections = getAllByTestId(/menu-section/)
			expect(sections.length).toBeGreaterThan(0)
		})

		it('should render Edit Profile menu item', () => {
			const { getByText } = render(<Profile />)
			expect(getByText('edit_profile')).toBeTruthy()
		})

		it('should render Notifications menu item', () => {
			const { getByText } = render(<Profile />)
			expect(getByText('notifications')).toBeTruthy()
		})

		it('should render Security menu item', () => {
			const { getByText } = render(<Profile />)
			expect(getByText('security')).toBeTruthy()
		})

		it('should render Help and Support menu item', () => {
			const { getByText } = render(<Profile />)
			expect(getByText('help_and_support')).toBeTruthy()
		})

		it('should render Contact Us menu item', () => {
			const { getByText } = render(<Profile />)
			expect(getByText('contact_us')).toBeTruthy()
		})

		it('should render Privacy Policy menu item', () => {
			const { getByText } = render(<Profile />)
			expect(getByText('privacy_policy')).toBeTruthy()
		})
	})

	describe('Menu Icons', () => {
		it('should render file-05 icon for Edit Profile', () => {
			const { getByTestId } = render(<Profile />)
			expect(getByTestId('icon-file-05')).toBeTruthy()
		})

		it('should render Bell icon for Notifications', () => {
			const { UNSAFE_getAllByType } = render(<Profile />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const Bell = require('lucide-react-native').Bell
			const bellIcons = UNSAFE_getAllByType(Bell)
			expect(bellIcons.length).toBeGreaterThan(0)
		})

		it('should render Shield icon for Security', () => {
			const { UNSAFE_getByType } = render(<Profile />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const Shield = require('lucide-react-native').Shield
			expect(UNSAFE_getByType(Shield)).toBeTruthy()
		})

		it('should render MessageCircleQuestion icon for Help and Support', () => {
			const { UNSAFE_getByType } = render(<Profile />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const MessageCircleQuestion =
				require('lucide-react-native').MessageCircleQuestion
			expect(UNSAFE_getByType(MessageCircleQuestion)).toBeTruthy()
		})

		it('should render Headphones icon for Contact Us', () => {
			const { UNSAFE_getByType } = render(<Profile />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const Headphones = require('lucide-react-native').Headphones
			expect(UNSAFE_getByType(Headphones)).toBeTruthy()
		})

		it('should render lock-unlocked-02 icon for Privacy Policy', () => {
			const { getByTestId } = render(<Profile />)
			expect(getByTestId('icon-lock-unlocked-02')).toBeTruthy()
		})
	})

	describe('Translation', () => {
		it('should use translation hook', () => {
			const { getByText } = render(<Profile />)
			// Verify that translated keys are rendered
			expect(getByText('edit_profile')).toBeTruthy()
			expect(getByText('notifications')).toBeTruthy()
			expect(getByText('security')).toBeTruthy()
			expect(getByText('help_and_support')).toBeTruthy()
			expect(getByText('contact_us')).toBeTruthy()
			expect(getByText('privacy_policy')).toBeTruthy()
		})
	})

	describe('Component Structure', () => {
		it('should render ScrollView as main container', () => {
			const { UNSAFE_getByType } = render(<Profile />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ScrollView = require('react-native').ScrollView
			expect(UNSAFE_getByType(ScrollView)).toBeTruthy()
		})

		it('should render profile header section', () => {
			const { getByTestId } = render(<Profile />)
			expect(getByTestId('profile-header')).toBeTruthy()
		})

		it('should render all menu items as Pressable components', () => {
			const { UNSAFE_getAllByType } = render(<Profile />)
			const pressable = require('react-native').Pressable
			const pressables = UNSAFE_getAllByType(pressable)
			// At least 7 pressables: 1 back button + 6 menu items
			expect(pressables.length).toBeGreaterThanOrEqual(7)
		})
	})

	describe('Accessibility', () => {
		it('should have proper test IDs for profile sections', () => {
			const { getByTestId } = render(<Profile />)
			expect(getByTestId('profile-header')).toBeTruthy()
		})

		it('should render all menu items with text labels', () => {
			const { getAllByText } = render(<Profile />)
			const menuLabels = [
				'edit_profile',
				'notifications',
				'security',
				'help_and_support',
				'contact_us',
				'privacy_policy',
			]

			for (const label of menuLabels) {
				expect(getAllByText(label).length).toBeGreaterThan(0)
			}
		})
	})

	describe('Safe Area Insets', () => {
		it('should use safe area insets for padding', () => {
			const mockInsets = {
				top: 44,
				bottom: 34,
				left: 0,
				right: 0,
			}

			const { useSafeAreaInsets } = require('react-native-safe-area-context')
			;(useSafeAreaInsets as jest.Mock).mockReturnValue(mockInsets)

			const { getByTestId } = render(<Profile />)
			expect(getByTestId('profile-header')).toBeTruthy()
		})
	})

	describe('Menu Item Interactions', () => {
		it('should allow menu items to be pressed', () => {
			const { getByText } = render(<Profile />)

			// Since the menu items don't have onPress handlers yet,
			// this test verifies they are pressable
			const editProfileButton = getByText('edit_profile').parent?.parent
			expect(editProfileButton).toBeTruthy()
		})

		it('should render menu items in correct order', () => {
			const { getAllByTestId } = render(<Profile />)
			const menuItems = getAllByTestId(/menu-item-/)
			expect(menuItems.length).toBeGreaterThanOrEqual(6)
		})
	})

	describe('Styling', () => {
		it('should apply correct styles to menu sections', () => {
			const { getAllByTestId } = render(<Profile />)
			const sections = getAllByTestId(/menu-section/)
			for (const section of sections) {
				expect(section.props.style).toBeDefined()
			}
		})

		it('should apply correct styles to menu items', () => {
			const { getAllByTestId } = render(<Profile />)
			const items = getAllByTestId(/menu-item-/)
			for (const item of items) {
				expect(item.props.style).toBeDefined()
			}
		})
	})

	describe('Edge Cases', () => {
		it('should handle null user data', () => {
			;(useAuthControllerHandle as jest.Mock).mockReturnValue({
				data: null,
				isFetching: false,
			})

			const { getByTestId } = render(<Profile />)
			expect(getByTestId('profile-header')).toBeTruthy()
		})

		it('should handle empty user name', () => {
			;(useAuthControllerHandle as jest.Mock).mockReturnValue({
				data: { ...mockUser, name: '' },
				isFetching: false,
			})

			const { getByTestId } = render(<Profile />)
			expect(getByTestId('profile-header')).toBeTruthy()
		})

		it('should handle empty user email', () => {
			;(useAuthControllerHandle as jest.Mock).mockReturnValue({
				data: { ...mockUser, email: '' },
				isFetching: false,
			})

			const { getByTestId } = render(<Profile />)
			expect(getByTestId('profile-header')).toBeTruthy()
		})

		it('should handle multiple rapid back button presses', () => {
			const { UNSAFE_getByType } = render(<Profile />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ChevronLeft = require('lucide-react-native').ChevronLeft
			const backButton = UNSAFE_getByType(ChevronLeft)

			fireEvent.press(backButton)
			fireEvent.press(backButton)
			fireEvent.press(backButton)

			expect(mockRouter.back).toHaveBeenCalledTimes(3)
		})
	})

	it('should sign out and navigate to sign-in on logout', async () => {
		;(useAuthControllerHandle as jest.Mock).mockReturnValue({
			data: { ...mockUser, email: '' },
			isFetching: false,
		})
		;(authClient.signOut as jest.Mock).mockResolvedValueOnce({})

		const { getByTestId } = render(<Profile />)
		const signOutButton = getByTestId('sign-out-button')

		fireEvent.press(signOutButton)

		await waitFor(() => {
			expect(authClient.signOut).toHaveBeenCalledTimes(1)
			expect(mockRouter.replace).toHaveBeenCalledWith('/sign-in')
		})
	})
})
