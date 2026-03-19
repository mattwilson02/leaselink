import { render, fireEvent, waitFor } from '@/utils/test-utils'
import NotFound from '@/app/+not-found'

describe('NotFound Component', () => {
	const mockReplace = jest.fn()
	const mockBack = jest.fn()

	beforeEach(() => {
		jest.clearAllMocks()

		jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue({
			replace: mockReplace,
			back: mockBack,
		})
	})

	it('renders correctly with all elements', async () => {
		const { getByTestId } = render(<NotFound />)

		await waitFor(() => {
			expect(getByTestId('error-text')).toBeTruthy()
			expect(getByTestId('heading-text')).toBeTruthy()
			expect(getByTestId('message-text')).toBeTruthy()
			expect(getByTestId('home-button')).toBeTruthy()
			expect(getByTestId('back-button')).toBeTruthy()
		})
	})

	it('clicking home button calls router.replace with correct path', async () => {
		const { getByTestId } = render(<NotFound />)

		const homeButton = getByTestId('home-button')
		fireEvent.press(homeButton)

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith('/')
			expect(mockBack).not.toHaveBeenCalled()
		})
	})

	it('clicking back button calls router.back', async () => {
		const { getByTestId } = render(<NotFound />)

		const backButton = getByTestId('back-button')
		fireEvent.press(backButton)

		await waitFor(() => {
			expect(mockBack).toHaveBeenCalled()
			expect(mockReplace).not.toHaveBeenCalled()
		})
	})
})
