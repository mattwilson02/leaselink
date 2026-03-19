import { render, screen, fireEvent } from '@testing-library/react-native'
import { ErrorModal } from '.'

describe('ErrorModal', () => {
	const mockSetShowModal = jest.fn()
	const errorMessage = 'This is an error message'

	const renderComponent = (
		show = true,
		onShowModal = mockSetShowModal,
		error: string | null | undefined = errorMessage,
	) => {
		return render(
			<ErrorModal
				showModal={show}
				setShowModal={onShowModal}
				errorMessage={error}
			/>,
		)
	}

	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('Basic Rendering', () => {
		it('should render all components when modal is open', () => {
			renderComponent()

			expect(screen.getByText('error')).toBeTruthy() // Title from translation
			expect(screen.getByText(errorMessage)).toBeTruthy() // Error message
			expect(screen.getByText('close')).toBeTruthy() // Button text from translation
		})

		it('should not render when showModal is false', () => {
			renderComponent(false)

			// With the real Modal component, we can check that elements are not in the DOM
			expect(screen.queryByText('error')).toBeNull()
			expect(screen.queryByText(errorMessage)).toBeNull()
			expect(screen.queryByText('close')).toBeNull()
		})
	})

	describe('Interactions', () => {
		it('should call setShowModal when close button is pressed', () => {
			renderComponent()

			const closeButton = screen.getByText('close')
			fireEvent.press(closeButton)

			expect(mockSetShowModal).toHaveBeenCalledWith(false)
		})

		it('should handle null error message', () => {
			renderComponent(true, mockSetShowModal, null)

			expect(screen.getByText('error')).toBeTruthy()
			expect(screen.queryByText(errorMessage)).toBeNull()
		})
	})
})
