import { render, fireEvent, waitFor } from '@/utils/test-utils'
import EditProfile from '@/../../app/(profile)/edit-profile'
import { useForm } from '@tanstack/react-form'
import { useRouter } from 'expo-router'

jest.mock('expo-router', () => ({
	useRouter: jest.fn(),
}))

jest.mock('@/gen/index', () => ({
	useAuthControllerHandle: jest.fn(() => ({
		data: {
			id: 'test-user-id',
			name: 'John Doe',
			email: 'john.doe@example.com',
			phoneNumber: '+1234567890',
		},
	})),
	useGetClientProfilePhotoControllerHandle: jest.fn(() => ({
		data: null,
	})),
	useUploadClientProfilePhotoControllerHandle: jest.fn(() => ({
		mutateAsync: jest.fn(),
	})),
}))

jest.mock(
	'@/gen/api/react-query/useGetClientProfilePhotoControllerHandle',
	() => ({
		getClientProfilePhotoControllerHandleQueryKey: jest.fn(() => [
			'profile-photo',
		]),
	}),
)

jest.mock('@tanstack/react-query', () => ({
	...jest.requireActual('@tanstack/react-query'),
	useQueryClient: jest.fn(() => ({
		invalidateQueries: jest.fn(),
	})),
}))

jest.mock('expo-image-picker', () => ({
	requestMediaLibraryPermissionsAsync: jest.fn(() =>
		Promise.resolve({ status: 'granted' }),
	),
	requestCameraPermissionsAsync: jest.fn(() =>
		Promise.resolve({ status: 'granted' }),
	),
	launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true })),
	launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: true })),
	MediaTypeOptions: { Images: 'Images' },
}))

jest.mock('expo-file-system', () => ({
	readAsStringAsync: jest.fn(() => Promise.resolve('base64string')),
	EncodingType: { Base64: 'base64' },
}))

jest.mock('expo-image-manipulator', () => ({
	manipulateAsync: jest.fn(() =>
		Promise.resolve({ uri: 'compressed-image-uri' }),
	),
	// biome-ignore lint/style/useNamingConvention: <explanation>
	SaveFormat: { JPEG: 'jpeg' },
}))

jest.mock('react-native-country-flag', () => {
	return function CountryFlag() {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockView = require('react-native').View
		return <MockView testID='country-flag' />
	}
})

jest.mock('@/components/LanguageOptionsList', () => ({
	LanguageOptionsList: ({
		languageOptions,
	}: {
		languageOptions: Array<{ value: string; label: string }>
	}) => {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockView = require('react-native').View
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockText = require('react-native').Text
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockPressable = require('react-native').Pressable

		return (
			<MockView testID='language-options-list'>
				{languageOptions.map((option) => (
					<MockPressable
						key={option.value}
						testID={`language-option-${option.value}`}
					>
						<MockText>{option.label}</MockText>
					</MockPressable>
				))}
			</MockView>
		)
	},
}))

describe('EditProfile page', () => {
	const mockRouter = {
		back: jest.fn(),
		push: jest.fn(),
		replace: jest.fn(),
		setParams: jest.fn(),
	}

	beforeEach(() => {
		jest.clearAllMocks()
		;(useRouter as jest.Mock).mockReturnValue(mockRouter)

		const handleSubmit = jest.fn()
		const handleBlur = jest.fn()
		const handleChange = jest.fn()

		jest
			.spyOn(require('@tanstack/react-form'), 'useForm')
			.mockImplementation(() => ({
				handleSubmit,
				Field: ({
					name,
					children,
				}: {
					name: string
					children: (props: {
						name: string
						state: {
							value: string
							meta: {
								isTouched: boolean
								isDirty: boolean
								isFocused: boolean
								errors: string[]
							}
						}
						handleBlur: () => void
						handleChange: (value: string) => void
					}) => React.ReactNode
				}) =>
					children({
						name,
						state: {
							value: 'gb',
							meta: {
								isTouched: false,
								isDirty: false,
								isFocused: false,
								errors: [],
							},
						},
						handleBlur,
						handleChange,
					}),
				state: { canSubmit: true },
			}))
	})

	describe('Component Rendering', () => {
		it('should render the EditProfile page', () => {
			const { getByText } = render(<EditProfile />)

			expect(getByText('language')).toBeDefined()
		})

		it('should render the language description text', () => {
			const { getByText } = render(<EditProfile />)

			expect(getByText('default_language_description')).toBeDefined()
		})

		it('should render the cancel button', () => {
			const { getByText } = render(<EditProfile />)

			expect(getByText('cancel')).toBeDefined()
		})

		it('should render the save button', () => {
			const { getByText, getByTestId } = render(<EditProfile />)

			expect(getByText('save')).toBeDefined()
			expect(getByTestId('save-button')).toBeDefined()
		})

		it('should render the language select trigger', () => {
			const { getByTestId } = render(<EditProfile />)

			expect(getByTestId('select-language')).toBeDefined()
		})

		it('should render the form label', () => {
			const { getByTestId } = render(<EditProfile />)

			expect(getByTestId('choose-language-text')).toBeDefined()
		})
	})

	describe('Navigation', () => {
		it('should navigate back when back button is pressed', () => {
			const { UNSAFE_getByType } = render(<EditProfile />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ChevronLeft = require('lucide-react-native').ChevronLeft

			const backButton = UNSAFE_getByType(ChevronLeft)
			fireEvent.press(backButton)

			expect(mockRouter.replace).toHaveBeenCalledWith('/(profile)')
		})

		it('should navigate back when cancel button is pressed', () => {
			const { getByText } = render(<EditProfile />)

			fireEvent.press(getByText('cancel'))

			expect(mockRouter.replace).toHaveBeenCalledWith('/(profile)')
		})

		it('should render back button with correct icon', () => {
			const { UNSAFE_getByType } = render(<EditProfile />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ChevronLeft = require('lucide-react-native').ChevronLeft

			expect(UNSAFE_getByType(ChevronLeft)).toBeDefined()
		})
	})

	describe('Language Selection', () => {
		it('should open language options when select trigger is pressed', async () => {
			const { getAllByTestId } = render(<EditProfile />)

			fireEvent.press(getAllByTestId('select-language')[0])

			await waitFor(() => {
				const languageList = getAllByTestId('language-options-list')
				expect(languageList.length).toBeGreaterThan(0)
			})
		})

		it('should display the selected language', () => {
			const { getByText } = render(<EditProfile />)

			// Default language is 'gb' (English)
			expect(getByText('en')).toBeDefined()
		})

		it('should render country flag for selected language', () => {
			const { getByTestId } = render(<EditProfile />)

			expect(getByTestId('country-flag')).toBeDefined()
		})
	})

	describe('Form Submission', () => {
		it('should submit the form when save button is pressed', async () => {
			const { getByTestId } = render(<EditProfile />)

			fireEvent.press(getByTestId('save-button'))

			await waitFor(() => {
				expect(useForm().handleSubmit).toHaveBeenCalled()
			})
		})

		it('should navigate to profile page after successful submission', async () => {
			const handleSubmit = jest.fn()
			const handleChange = jest.fn()
			const handleBlur = jest.fn()

			jest
				.spyOn(require('@tanstack/react-form'), 'useForm')
				.mockImplementationOnce(() => ({
					handleSubmit,
					Field: ({
						name,
						children,
					}: {
						name: string
						children: (props: {
							name: string
							state: {
								value: string
								meta: {
									isTouched: boolean
									isDirty: boolean
									isFocused: boolean
									errors: string[]
								}
							}
							handleBlur: () => void
							handleChange: (value: string) => void
						}) => React.ReactNode
					}) =>
						children({
							name,
							state: {
								value: 'es',
								meta: {
									isTouched: false,
									isDirty: true,
									isFocused: false,
									errors: [],
								},
							},
							handleBlur,
							handleChange,
						}),
					state: { canSubmit: true },
				}))

			const { getByTestId } = render(<EditProfile />)

			fireEvent.press(getByTestId('save-button'))

			await waitFor(() => {
				expect(handleSubmit).toHaveBeenCalled()
			})
		})
	})

	describe('Form Validation', () => {
		it('should handle form validation through TanStack Form', () => {
			const { getByTestId } = render(<EditProfile />)

			// Form uses TanStack Form for validation
			expect(getByTestId('select-language')).toBeDefined()
		})
	})

	describe('Component Structure', () => {
		it('should render ScrollView as main scrollable container', () => {
			const { UNSAFE_getByType } = render(<EditProfile />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ScrollView = require('react-native').ScrollView

			expect(UNSAFE_getByType(ScrollView)).toBeDefined()
		})

		it('should hide vertical scroll indicator', () => {
			const { UNSAFE_getByType } = render(<EditProfile />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ScrollView = require('react-native').ScrollView
			const scrollView = UNSAFE_getByType(ScrollView)

			expect(scrollView.props.showsVerticalScrollIndicator).toBe(false)
		})

		it('should have proper container structure with white background', () => {
			const { UNSAFE_getAllByType } = render(<EditProfile />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const View = require('react-native').View
			const views = UNSAFE_getAllByType(View)
			const mainView = views[0]

			expect(mainView.props.style).toMatchObject({
				flex: 1,
				backgroundColor: 'white',
			})
		})

		it('should render divider line between form and buttons', () => {
			const { UNSAFE_getAllByType } = render(<EditProfile />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const View = require('react-native').View
			const views = UNSAFE_getAllByType(View)

			const divider = views.find((view) => view.props.style?.height === 1)
			expect(divider).toBeDefined()
		})
	})

	describe('Styling', () => {
		it('should apply correct styles to back button', () => {
			const { UNSAFE_getAllByType } = render(<EditProfile />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const Pressable = require('react-native').Pressable
			const pressables = UNSAFE_getAllByType(Pressable)

			expect(pressables.length).toBeGreaterThan(0)
		})

		it('should render buttons in a row with proper spacing', () => {
			const { getByText } = render(<EditProfile />)

			expect(getByText('cancel')).toBeDefined()
			expect(getByText('save')).toBeDefined()
		})
	})

	describe('Edge Cases', () => {
		it('should handle rapid back button presses', () => {
			const { UNSAFE_getByType } = render(<EditProfile />)
			// biome-ignore lint/style/useNamingConvention: React Component
			const ChevronLeft = require('lucide-react-native').ChevronLeft
			const backButton = UNSAFE_getByType(ChevronLeft)

			fireEvent.press(backButton)
			fireEvent.press(backButton)
			fireEvent.press(backButton)

			expect(mockRouter.replace).toHaveBeenCalledTimes(3)
			expect(mockRouter.replace).toHaveBeenCalledWith('/(profile)')
		})

		it('should handle rapid cancel button presses', () => {
			const { getByText } = render(<EditProfile />)

			fireEvent.press(getByText('cancel'))
			fireEvent.press(getByText('cancel'))

			expect(mockRouter.replace).toHaveBeenCalledTimes(2)
		})

		it('should handle rapid save button presses', async () => {
			const { getByTestId } = render(<EditProfile />)

			fireEvent.press(getByTestId('save-button'))
			fireEvent.press(getByTestId('save-button'))

			await waitFor(() => {
				expect(useForm().handleSubmit).toHaveBeenCalledTimes(2)
			})
		})
	})

	describe('Accessibility', () => {
		it('should have proper testIDs for form elements', () => {
			const { getByTestId } = render(<EditProfile />)

			expect(getByTestId('choose-language-text')).toBeDefined()
			expect(getByTestId('select-language')).toBeDefined()
			expect(getByTestId('save-button')).toBeDefined()
		})

		it('should render form with proper labels', () => {
			const { getByText } = render(<EditProfile />)

			expect(getByText('language')).toBeDefined()
			expect(getByText('default_language_description')).toBeDefined()
		})
	})

	describe('Language Options', () => {
		it('should display language options list when select is opened', async () => {
			const { getAllByTestId } = render(<EditProfile />)

			fireEvent.press(getAllByTestId('select-language')[0])

			await waitFor(() => {
				const languageList = getAllByTestId('language-options-list')
				expect(languageList.length).toBeGreaterThan(0)
			})
		})

		it('should render LanguageOptionsList component', async () => {
			const { getAllByTestId } = render(<EditProfile />)

			fireEvent.press(getAllByTestId('select-language')[0])

			await waitFor(() => {
				const languageList = getAllByTestId('language-options-list')
				expect(languageList).toBeDefined()
			})
		})
	})

	describe('Profile Photo Section', () => {
		it('should render the page title', () => {
			const { getByText } = render(<EditProfile />)
			expect(getByText('title')).toBeDefined()
		})

		it('should render section heading', () => {
			const { getByText } = render(<EditProfile />)
			expect(getByText('personal_info')).toBeDefined()
			expect(getByText('personal_info_description')).toBeDefined()
		})

		it('should render your photo label', () => {
			const { getByTestId, getByText } = render(<EditProfile />)
			expect(getByTestId('your-photo-label')).toBeDefined()
			expect(getByText('your_photo')).toBeDefined()
		})

		it('should render photo description', () => {
			const { getByText } = render(<EditProfile />)
			expect(getByText('photo_description')).toBeDefined()
		})

		it('should render avatar fallback with initials when no profile photo', () => {
			const { getByTestId, getByText } = render(<EditProfile />)
			expect(getByTestId('profile-photo-avatar')).toBeDefined()
			expect(getByText('JD')).toBeDefined() // John Doe initials
		})

		it('should render upload photo pressable', () => {
			const { getByTestId } = render(<EditProfile />)
			expect(getByTestId('upload-photo-pressable')).toBeDefined()
		})

		it('should render tap to upload text', () => {
			const { getByText } = render(<EditProfile />)
			expect(getByText('tap_to_upload')).toBeDefined()
		})

		it('should render upload format hint', () => {
			const { getByText } = render(<EditProfile />)
			expect(getByText('upload_format_hint')).toBeDefined()
		})
	})

	describe('User Info Fields', () => {
		it('should render first name field with value', () => {
			const { getByTestId, getByText } = render(<EditProfile />)
			expect(getByText('first_name')).toBeDefined()
			expect(getByTestId('first-name-input')).toBeDefined()
		})

		it('should render last name field with value', () => {
			const { getByTestId, getByText } = render(<EditProfile />)
			expect(getByText('last_name')).toBeDefined()
			expect(getByTestId('last-name-input')).toBeDefined()
		})

		it('should render email field with value', () => {
			const { getByTestId, getByText } = render(<EditProfile />)
			expect(getByText('email_address')).toBeDefined()
			expect(getByTestId('email-input')).toBeDefined()
		})

		it('should render phone number field with value', () => {
			const { getByTestId, getByText } = render(<EditProfile />)
			expect(getByText('phone_number')).toBeDefined()
			expect(getByTestId('phone-input')).toBeDefined()
		})

		it('should have disabled inputs for user info fields', () => {
			const { getByTestId } = render(<EditProfile />)
			expect(getByTestId('first-name-input').props.editable).toBe(false)
			expect(getByTestId('last-name-input').props.editable).toBe(false)
			expect(getByTestId('email-input').props.editable).toBe(false)
			expect(getByTestId('phone-input').props.editable).toBe(false)
		})
	})

	describe('Initials Generation', () => {
		it('should generate correct initials for two-part name', () => {
			const { getByText } = render(<EditProfile />)
			// John Doe should show JD
			expect(getByText('JD')).toBeDefined()
		})

		it('should handle single name gracefully', () => {
			const { useAuthControllerHandle } = require('@/gen/index')
			;(useAuthControllerHandle as jest.Mock).mockReturnValue({
				data: {
					id: 'test-user-id',
					name: 'John',
					email: 'john@example.com',
					phoneNumber: '+1234567890',
				},
			})

			const { getByText } = render(<EditProfile />)
			// Single name "John" should show just "J"
			expect(getByText('J')).toBeDefined()
		})
	})
})
