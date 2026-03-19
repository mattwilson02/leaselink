import Faqs from '@/../../app/(profile)/faqs'
import { render, fireEvent } from '@/utils/test-utils'

jest.mock('expo-router', () => ({
	useRouter: jest.fn(),
	useLocalSearchParams: jest.fn(),
}))

jest.mock('react-i18next', () => ({
	useTranslation: (namespace?: string) => ({
		t: (key: string) => {
			const translations: Record<string, Record<string, string>> = {
				faqs: {
					title: 'FAQs',
					heading: 'Frequently asked questions',
					subheading: "Have questions? We're here to help.",
					free_trial_question: 'Is there a free trial available?',
					free_trial_answer:
						'Yes, you can try us for free for 30 days. Our friendly team will work with you to get you up and running as soon as possible.',
					change_plan_question: 'Can I change my plan later?',
					change_plan_answer:
						'Of course. Our pricing scales with your company. Chat to our friendly team to find a solution that works for you.',
					cancellation_question: 'What is your cancellation policy?',
					cancellation_answer:
						"We understand that things change. You can cancel your plan at any time and we'll refund you the difference already paid.",
					invoice_question: 'Can other info be added to an invoice?',
					invoice_answer:
						"At the moment, the only way to add additional information to invoices is to add the information to the workspace's name.",
					billing_question: 'How does billing work?',
					billing_answer:
						'Plans are per workspace, not per account. You can upgrade one workspace, and still have any number of free workspaces.',
					email_question: 'How do I change my account email?',
					email_answer:
						'You can change the email address associated with your account by going to untitled.com/account from a laptop or desktop.',
				},
				general: {
					search: 'Search',
				},
			}
			return translations[namespace || 'faqs']?.[key] || key
		},
		i18n: {
			language: 'en',
			changeLanguage: jest.fn(),
		},
	}),
}))

jest.mock('@/components/Icon', () => ({
	Icon: {
		IconContainer: ({ children }: { children: React.ReactNode }) => {
			// biome-ignore lint/style/useNamingConvention: React Component
			const MockView = require('react-native').View
			return <MockView testID='icon-container'>{children}</MockView>
		},
	},
}))

describe('Faqs Component', () => {
	const mockRouter = {
		back: jest.fn(),
		push: jest.fn(),
		replace: jest.fn(),
		setParams: jest.fn(),
	}

	beforeEach(() => {
		jest.clearAllMocks()
		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue(mockRouter)
		jest
			.spyOn(require('expo-router'), 'useLocalSearchParams')
			.mockReturnValue({})
	})

	describe('Rendering', () => {
		it('should render the FAQ page successfully', () => {
			const { getByTestId } = render(<Faqs />)
			expect(getByTestId('search-input')).toBeTruthy()
		})

		it('should render the page title', () => {
			const { getByText } = render(<Faqs />)
			expect(getByText('FAQs')).toBeTruthy()
		})

		it('should render the heading', () => {
			const { getByText } = render(<Faqs />)
			expect(getByText('Frequently asked questions')).toBeTruthy()
		})

		it('should render the subheading', () => {
			const { getByText } = render(<Faqs />)
			expect(getByText("Have questions? We're here to help.")).toBeTruthy()
		})

		it('should render the search input with placeholder', () => {
			const { getByPlaceholderText } = render(<Faqs />)
			expect(getByPlaceholderText('Search')).toBeTruthy()
		})

		it('should render back button', () => {
			const { UNSAFE_getAllByType } = render(<Faqs />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const Pressable = require('react-native').Pressable
			const pressables = UNSAFE_getAllByType(Pressable)
			expect(pressables.length).toBeGreaterThan(0)
		})
	})

	describe('FAQ Items', () => {
		it('should render all 6 FAQ items', () => {
			const { getAllByTestId } = render(<Faqs />)
			const iconContainers = getAllByTestId('icon-container')
			expect(iconContainers).toHaveLength(6)
		})

		it('should render free trial FAQ question', () => {
			const { getByText } = render(<Faqs />)
			expect(getByText('Is there a free trial available?')).toBeTruthy()
		})

		it('should render free trial FAQ answer', () => {
			const { getByText } = render(<Faqs />)
			expect(
				getByText(
					'Yes, you can try us for free for 30 days. Our friendly team will work with you to get you up and running as soon as possible.',
				),
			).toBeTruthy()
		})

		it('should render change plan FAQ question', () => {
			const { getByText } = render(<Faqs />)
			expect(getByText('Can I change my plan later?')).toBeTruthy()
		})

		it('should render change plan FAQ answer', () => {
			const { getByText } = render(<Faqs />)
			expect(
				getByText(
					'Of course. Our pricing scales with your company. Chat to our friendly team to find a solution that works for you.',
				),
			).toBeTruthy()
		})

		it('should render cancellation FAQ question', () => {
			const { getByText } = render(<Faqs />)
			expect(getByText('What is your cancellation policy?')).toBeTruthy()
		})

		it('should render cancellation FAQ answer', () => {
			const { getByText } = render(<Faqs />)
			expect(
				getByText(
					"We understand that things change. You can cancel your plan at any time and we'll refund you the difference already paid.",
				),
			).toBeTruthy()
		})

		it('should render invoice FAQ question', () => {
			const { getByText } = render(<Faqs />)
			expect(getByText('Can other info be added to an invoice?')).toBeTruthy()
		})

		it('should render invoice FAQ answer', () => {
			const { getByText } = render(<Faqs />)
			expect(
				getByText(
					"At the moment, the only way to add additional information to invoices is to add the information to the workspace's name.",
				),
			).toBeTruthy()
		})

		it('should render billing FAQ question', () => {
			const { getByText } = render(<Faqs />)
			expect(getByText('How does billing work?')).toBeTruthy()
		})

		it('should render billing FAQ answer', () => {
			const { getByText } = render(<Faqs />)
			expect(
				getByText(
					'Plans are per workspace, not per account. You can upgrade one workspace, and still have any number of free workspaces.',
				),
			).toBeTruthy()
		})

		it('should render email FAQ question', () => {
			const { getByText } = render(<Faqs />)
			expect(getByText('How do I change my account email?')).toBeTruthy()
		})

		it('should render email FAQ answer', () => {
			const { getByText } = render(<Faqs />)
			expect(
				getByText(
					'You can change the email address associated with your account by going to untitled.com/account from a laptop or desktop.',
				),
			).toBeTruthy()
		})
	})

	describe('Search Functionality', () => {
		it('should display search input', () => {
			const { getByTestId } = render(<Faqs />)
			const searchInput = getByTestId('search-input')
			expect(searchInput).toBeTruthy()
		})

		it('should call router.setParams when search text changes', () => {
			const { getByTestId } = render(<Faqs />)
			const searchInput = getByTestId('search-input')

			fireEvent.changeText(searchInput, 'trial')

			expect(mockRouter.setParams).toHaveBeenCalledWith({ search: 'trial' })
		})

		it('should update search params with empty string', () => {
			const { getByTestId } = render(<Faqs />)
			const searchInput = getByTestId('search-input')

			fireEvent.changeText(searchInput, '')

			expect(mockRouter.setParams).toHaveBeenCalledWith({ search: '' })
		})

		it('should filter FAQs by question text', () => {
			jest
				.spyOn(require('expo-router'), 'useLocalSearchParams')
				.mockReturnValue({ search: 'trial' })

			const { getByText, queryByText } = render(<Faqs />)

			// Should show the free trial FAQ
			expect(getByText('Is there a free trial available?')).toBeTruthy()

			// Should not show unrelated FAQs
			expect(queryByText('How does billing work?')).toBeNull()
		})

		it('should filter FAQs by answer text', () => {
			jest
				.spyOn(require('expo-router'), 'useLocalSearchParams')
				.mockReturnValue({ search: 'workspace' })

			const { getByText, queryByText } = render(<Faqs />)

			// Should show FAQs with "workspace" in the answer
			expect(getByText('How does billing work?')).toBeTruthy()
			expect(getByText('Can other info be added to an invoice?')).toBeTruthy()

			// Should not show unrelated FAQs
			expect(queryByText('Is there a free trial available?')).toBeNull()
		})

		it('should filter FAQs case-insensitively', () => {
			jest
				.spyOn(require('expo-router'), 'useLocalSearchParams')
				.mockReturnValue({ search: 'TRIAL' })

			const { getByText } = render(<Faqs />)

			expect(getByText('Is there a free trial available?')).toBeTruthy()
		})

		it('should show all FAQs when search is empty', () => {
			jest
				.spyOn(require('expo-router'), 'useLocalSearchParams')
				.mockReturnValue({ search: '' })

			const { getAllByTestId } = render(<Faqs />)
			const iconContainers = getAllByTestId('icon-container')
			expect(iconContainers).toHaveLength(6)
		})

		it('should show no FAQs when search has no matches', () => {
			jest
				.spyOn(require('expo-router'), 'useLocalSearchParams')
				.mockReturnValue({ search: 'xyz123nonexistent' })

			const { queryAllByTestId } = render(<Faqs />)
			const iconContainers = queryAllByTestId('icon-container')
			expect(iconContainers).toHaveLength(0)
		})

		it('should show multiple matching FAQs', () => {
			jest
				.spyOn(require('expo-router'), 'useLocalSearchParams')
				.mockReturnValue({ search: 'can' })

			const { getByText } = render(<Faqs />)

			// Multiple FAQs contain "can"
			expect(getByText('Can I change my plan later?')).toBeTruthy()
			expect(getByText('Can other info be added to an invoice?')).toBeTruthy()
			expect(getByText('What is your cancellation policy?')).toBeTruthy()
		})
	})

	describe('Navigation', () => {
		it('should call router.back when back button is pressed', () => {
			const { UNSAFE_getAllByType } = render(<Faqs />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const Pressable = require('react-native').Pressable
			const backButton = UNSAFE_getAllByType(Pressable)[0]

			fireEvent.press(backButton)

			expect(mockRouter.back).toHaveBeenCalledTimes(1)
		})

		it('should not navigate when pressing other areas', () => {
			const { getByTestId } = render(<Faqs />)
			const searchInput = getByTestId('search-input')

			fireEvent(searchInput, 'focus')

			expect(mockRouter.back).not.toHaveBeenCalled()
		})
	})

	describe('Search Input Properties', () => {
		it('should have autoFocus enabled', () => {
			const { getByTestId } = render(<Faqs />)
			const searchInput = getByTestId('search-input')

			expect(searchInput.props.autoFocus).toBe(true)
		})

		it('should have autoCapitalize set to none', () => {
			const { getByTestId } = render(<Faqs />)
			const searchInput = getByTestId('search-input')

			expect(searchInput.props.autoCapitalize).toBe('none')
		})

		it('should display current search value', () => {
			jest
				.spyOn(require('expo-router'), 'useLocalSearchParams')
				.mockReturnValue({ search: 'test search' })

			const { getByTestId } = render(<Faqs />)
			const searchInput = getByTestId('search-input')

			expect(searchInput.props.value).toBe('test search')
		})

		it('should handle undefined search param', () => {
			jest
				.spyOn(require('expo-router'), 'useLocalSearchParams')
				.mockReturnValue({})

			const { getByTestId } = render(<Faqs />)
			const searchInput = getByTestId('search-input')

			expect(searchInput.props.value).toBeUndefined()
		})
	})

	describe('Component Structure', () => {
		it('should render ScrollView', () => {
			const { UNSAFE_getByType } = render(<Faqs />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ScrollView = require('react-native').ScrollView

			expect(UNSAFE_getByType(ScrollView)).toBeTruthy()
		})

		it('should hide vertical scroll indicator', () => {
			const { UNSAFE_getByType } = render(<Faqs />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ScrollView = require('react-native').ScrollView
			const scrollView = UNSAFE_getByType(ScrollView)

			expect(scrollView.props.showsVerticalScrollIndicator).toBe(false)
		})

		it('should render all FAQ items with proper structure', () => {
			const { getAllByTestId } = render(<Faqs />)
			const iconContainers = getAllByTestId('icon-container')

			// Each FAQ should have an icon container
			expect(iconContainers).toHaveLength(6)
		})
	})

	describe('Translations', () => {
		it('should use translation for search placeholder', () => {
			const { getByPlaceholderText } = render(<Faqs />)
			// The general translation for "Search" should be used
			expect(getByPlaceholderText('Search')).toBeTruthy()
		})

		it('should display all FAQ content in English by default', () => {
			const { getByText } = render(<Faqs />)

			// Verify English translations are displayed
			expect(getByText('FAQs')).toBeTruthy()
			expect(getByText('Frequently asked questions')).toBeTruthy()
			expect(getByText("Have questions? We're here to help.")).toBeTruthy()
		})
	})

	describe('Edge Cases', () => {
		it('should handle search with special characters', () => {
			const { getByTestId } = render(<Faqs />)
			const searchInput = getByTestId('search-input')

			fireEvent.changeText(searchInput, '@#$%')

			expect(mockRouter.setParams).toHaveBeenCalledWith({ search: '@#$%' })
		})

		it('should handle very long search queries', () => {
			const { getByTestId } = render(<Faqs />)
			const searchInput = getByTestId('search-input')
			const longQuery = 'a'.repeat(1000)

			fireEvent.changeText(searchInput, longQuery)

			expect(mockRouter.setParams).toHaveBeenCalledWith({ search: longQuery })
		})

		it('should render when all FAQs are filtered out', () => {
			jest
				.spyOn(require('expo-router'), 'useLocalSearchParams')
				.mockReturnValue({ search: 'nonexistentquery123' })

			const { getByTestId, queryAllByTestId } = render(<Faqs />)

			// Search input should still be present
			expect(getByTestId('search-input')).toBeTruthy()

			// No FAQ items should be rendered
			const iconContainers = queryAllByTestId('icon-container')
			expect(iconContainers).toHaveLength(0)
		})
	})
})
