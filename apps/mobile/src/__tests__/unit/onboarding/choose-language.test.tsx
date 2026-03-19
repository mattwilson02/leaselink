import { render, fireEvent, waitFor } from '@/utils/test-utils'
import ChooseLanguage from '@/app/(onboarding)/choose-language'
import { useForm } from '@tanstack/react-form'

describe('ChooseLanguage page', () => {
	beforeEach(() => {
		jest.clearAllMocks()

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
						handleChange: () => void
					}) => React.ReactNode
				}) =>
					children({
						name,
						state: {
							value: '',
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

	it('should render the ChooseLanguage page', () => {
		const { getByText } = render(<ChooseLanguage />)

		expect(getByText('choose_language')).toBeDefined()
	})

	it('should navigate to the next page when the form is submitted', async () => {
		const { getByText, getByTestId } = render(<ChooseLanguage />)

		expect(getByTestId('select-language')).toBeDefined()
		fireEvent.press(getByTestId('select-language'))
		fireEvent.press(getByText('en'))

		fireEvent.press(getByText('next'))

		await waitFor(() => {
			expect(useForm().handleSubmit).toHaveBeenCalled()
		})
	})

	it('should show an error when the form is submitted without selecting a language', async () => {
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
						handleChange: () => void
					}) => React.ReactNode
				}) =>
					children({
						name,
						state: {
							value: '',
							meta: {
								isTouched: true,
								isDirty: false,
								isFocused: false,
								errors: ['Language is required'],
							},
						},
						handleBlur,
						handleChange,
					}),
				state: { canSubmit: true },
			}))

		const { getByText } = render(<ChooseLanguage />)

		fireEvent.press(getByText('next'))

		await waitFor(() => {
			expect(getByText('Language is required')).toBeDefined()
		})
	})
})
