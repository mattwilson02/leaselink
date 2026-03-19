import PrivacyPolicy from '@/../../app/(profile)/privacy-policy'
import { render, fireEvent } from '@testing-library/react-native'
import { useRouter } from 'expo-router'

jest.mock('expo-router', () => ({
	useRouter: jest.fn(),
}))

describe('Privacy Policy Component', () => {
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

	describe('Component Rendering', () => {
		it('should render the privacy policy page', () => {
			const { getByText } = render(<PrivacyPolicy />)
			expect(getByText('Privacy Policy')).toBeTruthy()
		})

		it('should render the current date', () => {
			const { getByText } = render(<PrivacyPolicy />)
			expect(getByText('Current as of 20 Jan 2025')).toBeTruthy()
		})

		it('should render the introduction text', () => {
			const { getByText } = render(<PrivacyPolicy />)
			expect(
				getByText(/Your privacy is important to us at Untitled/i),
			).toBeTruthy()
		})
	})

	describe('Navigation', () => {
		it('should navigate back when back button is pressed', () => {
			const { UNSAFE_getByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ChevronLeft = require('lucide-react-native').ChevronLeft

			const backButton = UNSAFE_getByType(ChevronLeft)
			fireEvent.press(backButton)

			expect(mockRouter.back).toHaveBeenCalledTimes(1)
		})

		it('should call router.back only once per press', () => {
			const { UNSAFE_getByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ChevronLeft = require('lucide-react-native').ChevronLeft

			const backButton = UNSAFE_getByType(ChevronLeft)
			fireEvent.press(backButton)
			fireEvent.press(backButton)

			expect(mockRouter.back).toHaveBeenCalledTimes(2)
		})

		it('should render back button with correct icon', () => {
			const { UNSAFE_getByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ChevronLeft = require('lucide-react-native').ChevronLeft

			expect(UNSAFE_getByType(ChevronLeft)).toBeTruthy()
		})
	})

	describe('Content Sections', () => {
		it('should render "What information do we collect?" section', () => {
			const { getByText } = render(<PrivacyPolicy />)
			expect(getByText('What information do we collect?')).toBeTruthy()
		})

		it('should render "How do we use your information?" section', () => {
			const { getByText } = render(<PrivacyPolicy />)
			expect(getByText('How do we use your information?')).toBeTruthy()
		})

		it('should render "Do we use cookies and other tracking technologies?" section', () => {
			const { getByText } = render(<PrivacyPolicy />)
			expect(
				getByText('Do we use cookies and other tracking technologies?'),
			).toBeTruthy()
		})

		it('should render "How do we keep your information safe?" section', () => {
			const { getByText } = render(<PrivacyPolicy />)
			expect(getByText('How do we keep your information safe?')).toBeTruthy()
		})

		it('should render "What are your privacy rights?" section', () => {
			const { getByText } = render(<PrivacyPolicy />)
			expect(getByText('What are your privacy rights?')).toBeTruthy()
		})

		it('should render "How can you contact us about this policy?" section', () => {
			const { getByText } = render(<PrivacyPolicy />)
			expect(
				getByText('How can you contact us about this policy?'),
			).toBeTruthy()
		})

		it('should render all 6 section headings', () => {
			const { getAllByText } = render(<PrivacyPolicy />)
			const headings = [
				'What information do we collect?',
				'How do we use your information?',
				'Do we use cookies and other tracking technologies?',
				'How do we keep your information safe?',
				'What are your privacy rights?',
				'How can you contact us about this policy?',
			]

			for (const heading of headings) {
				expect(getAllByText(heading).length).toBeGreaterThan(0)
			}
		})
	})

	describe('Content Structure', () => {
		it('should render introduction paragraphs', () => {
			const { getByText } = render(<PrivacyPolicy />)
			expect(
				getByText(/Mi tincidunt elit, id quisque ligula ac diam/i),
			).toBeTruthy()
			expect(getByText(/Eget quis mi enim, leo lacinia pharetra/i)).toBeTruthy()
		})

		it('should render content under "What information do we collect?"', () => {
			const { getAllByText } = render(<PrivacyPolicy />)
			const content = getAllByText(/Dolor enim eu tortor urna sed duis nulla/i)
			expect(content.length).toBeGreaterThan(0)
		})

		it('should render content under "How do we use your information?"', () => {
			const { getAllByText } = render(<PrivacyPolicy />)
			const content = getAllByText(/Dolor enim eu tortor urna sed duis nulla/i)
			expect(content.length).toBeGreaterThanOrEqual(2)
		})

		it('should render content under cookies section', () => {
			const { getAllByText } = render(<PrivacyPolicy />)
			const content = getAllByText(
				/Pharetra morbi libero id aliquam elit massa/i,
			)
			expect(content.length).toBeGreaterThan(0)
		})

		it('should render numbered list in contact section', () => {
			const { getByText } = render(<PrivacyPolicy />)
			expect(getByText(/1\. Lectus id duis vitae porttitor/i)).toBeTruthy()
		})
	})

	describe('Component Structure', () => {
		it('should render ScrollView as main scrollable container', () => {
			const { UNSAFE_getByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ScrollView = require('react-native').ScrollView

			expect(UNSAFE_getByType(ScrollView)).toBeTruthy()
		})

		it('should render main heading component', () => {
			const { UNSAFE_getAllByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const Heading = require('@sf-digital-ui/react-native').Heading
			const headings = UNSAFE_getAllByType(Heading)

			expect(headings.length).toBeGreaterThan(0)
		})

		it('should render multiple text components', () => {
			const { UNSAFE_getAllByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const Text = require('@sf-digital-ui/react-native').Text
			const texts = UNSAFE_getAllByType(Text)

			expect(texts.length).toBeGreaterThan(5)
		})

		it('should have proper container structure', () => {
			const { UNSAFE_getAllByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const View = require('react-native').View
			const views = UNSAFE_getAllByType(View)

			expect(views.length).toBeGreaterThan(0)
		})
	})

	describe('Styling', () => {
		it('should apply correct styles to back button', () => {
			const { UNSAFE_getAllByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const Pressable = require('react-native').Pressable
			const pressables = UNSAFE_getAllByType(Pressable)
			const backButton = pressables[0]

			expect(backButton.props.style).toBeDefined()
		})

		it('should hide vertical scroll indicator', () => {
			const { UNSAFE_getByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ScrollView = require('react-native').ScrollView
			const scrollView = UNSAFE_getByType(ScrollView)

			expect(scrollView.props.showsVerticalScrollIndicator).toBe(false)
		})
	})

	describe('Accessibility', () => {
		it('should render all section headings as Heading components', () => {
			const { UNSAFE_getAllByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const Heading = require('@sf-digital-ui/react-native').Heading
			const headings = UNSAFE_getAllByType(Heading)

			// 1 main heading + 6 section headings
			expect(headings.length).toBe(7)
		})

		it('should have readable text content', () => {
			const { getByText } = render(<PrivacyPolicy />)

			// Verify key sections are accessible
			expect(getByText('Privacy Policy')).toBeTruthy()
			expect(getByText('What information do we collect?')).toBeTruthy()
			expect(getByText('How do we use your information?')).toBeTruthy()
		})
	})

	describe('Content Completeness', () => {
		it('should render introduction section with gap styling', () => {
			const { UNSAFE_getAllByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const View = require('react-native').View
			const views = UNSAFE_getAllByType(View)

			const introView = views.find(
				(view) =>
					view.props.style?.gap === 16 &&
					view.props.style?.alignItems === 'center',
			)
			expect(introView).toBeDefined()
		})

		it('should render multiple content sections with consistent gap', () => {
			const { UNSAFE_getAllByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const View = require('react-native').View
			const views = UNSAFE_getAllByType(View)

			const sectionViews = views.filter((view) => view.props.style?.gap === 16)
			expect(sectionViews.length).toBeGreaterThan(5)
		})

		it('should render all paragraph texts', () => {
			const { UNSAFE_getAllByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const Text = require('@sf-digital-ui/react-native').Text
			const texts = UNSAFE_getAllByType(Text)

			// Should have date + intro + section content texts
			expect(texts.length).toBeGreaterThanOrEqual(15)
		})
	})

	describe('Edge Cases', () => {
		it('should handle multiple rapid back button presses', () => {
			const { UNSAFE_getByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ChevronLeft = require('lucide-react-native').ChevronLeft
			const backButton = UNSAFE_getByType(ChevronLeft)

			fireEvent.press(backButton)
			fireEvent.press(backButton)
			fireEvent.press(backButton)

			expect(mockRouter.back).toHaveBeenCalledTimes(3)
		})

		it('should handle router back callback correctly', () => {
			const { UNSAFE_getByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ChevronLeft = require('lucide-react-native').ChevronLeft
			const backButton = UNSAFE_getByType(ChevronLeft)

			fireEvent.press(backButton)

			expect(mockRouter.back).toHaveBeenCalledTimes(1)
		})
	})

	describe('Layout', () => {
		it('should have white background color', () => {
			const { UNSAFE_getAllByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const View = require('react-native').View
			const views = UNSAFE_getAllByType(View)
			const mainView = views[0]

			expect(mainView.props.style).toMatchObject({
				flex: 1,
				backgroundColor: 'white',
			})
		})

		it('should apply proper spacing with gap', () => {
			const { UNSAFE_getAllByType } = render(<PrivacyPolicy />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const View = require('react-native').View
			const views = UNSAFE_getAllByType(View)
			const mainView = views[0]

			expect(mainView.props.style.gap).toBe(32)
		})
	})
})
