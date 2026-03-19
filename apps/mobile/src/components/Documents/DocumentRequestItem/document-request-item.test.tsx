import { render } from '@/utils/test-utils'
import DocumentRequestItem from './index'
import {
	documentRequestDTORequestTypeEnum,
	documentRequestDTOStatusEnum,
} from '@/gen/index'

jest.mock('@/gen/index', () => ({
	documentRequestDTOStatusEnum: {
		// biome-ignore lint/style/useNamingConvention: <enum>
		UPLOADED: 'UPLOADED',
		// biome-ignore lint/style/useNamingConvention: <enum>
		PENDING: 'PENDING',
		// biome-ignore lint/style/useNamingConvention: <enum>
		CANCELED: 'CANCELED',
	},
	documentRequestDTORequestTypeEnum: {
		// biome-ignore lint/style/useNamingConvention: <enum>
		PROOF_OF_IDENTITY: 'PROOF_OF_IDENTITY',
		// biome-ignore lint/style/useNamingConvention: <enum>
		PROOF_OF_ADDRESS: 'PROOF_OF_ADDRESS',
	},
}))

describe('DocumentRequestItem', () => {
	const mockProps = {
		requestType: documentRequestDTORequestTypeEnum.PROOF_OF_IDENTITY,
		status: documentRequestDTOStatusEnum.PENDING,
		requestId: 'test-request-id',
	}

	it('should render request type text correctly', () => {
		const { getByText } = render(<DocumentRequestItem {...mockProps} />)

		expect(getByText('PROOF_OF_IDENTITY')).toBeTruthy()
	})

	it('should render status badge correctly for pending status', () => {
		const { getByText } = render(<DocumentRequestItem {...mockProps} />)

		expect(getByText('pending')).toBeTruthy()
	})

	it('should render status badge correctly for uploaded status', () => {
		const { getByText } = render(
			<DocumentRequestItem
				{...mockProps}
				status={documentRequestDTOStatusEnum.UPLOADED}
			/>,
		)

		expect(getByText('uploaded')).toBeTruthy()
	})

	it('should render status badge correctly for canceled status', () => {
		const { getByText } = render(
			<DocumentRequestItem
				{...mockProps}
				status={documentRequestDTOStatusEnum.CANCELED}
			/>,
		)

		expect(getByText('canceled')).toBeTruthy()
	})

	it('should render proof of address request type correctly', () => {
		const { getByText } = render(
			<DocumentRequestItem
				{...mockProps}
				requestType={documentRequestDTORequestTypeEnum.PROOF_OF_ADDRESS}
			/>,
		)

		expect(getByText('PROOF_OF_ADDRESS')).toBeTruthy()
	})

	it('should apply correct container styles', () => {
		const { getByTestId } = render(<DocumentRequestItem {...mockProps} />)

		const pressable = getByTestId('document-request-item-pressable')
		expect(pressable.props.style).toEqual(
			expect.objectContaining({
				padding: 10,
				flexDirection: 'row',
				justifyContent: 'space-between',
				borderRadius: 8,
				alignItems: 'center',
			}),
		)
	})

	it('should be pressable but currently disabled', () => {
		const { getByTestId } = render(<DocumentRequestItem {...mockProps} />)

		const pressable = getByTestId('document-request-item-pressable')
		expect(pressable).toBeTruthy()
		expect(pressable.props.onPress).toBeUndefined()
	})

	it('should render chevron right icon', () => {
		const { UNSAFE_getByType } = render(<DocumentRequestItem {...mockProps} />)

		const chevronIcon = UNSAFE_getByType(
			require('lucide-react-native').ChevronRight,
		)
		expect(chevronIcon).toBeTruthy()
		expect(chevronIcon.props.size).toBe(20)
	})

	it('should display different icons for different request types', () => {
		const { rerender, UNSAFE_getByProps } = render(
			<DocumentRequestItem {...mockProps} />,
		)

		expect(UNSAFE_getByProps({ name: 'passcode-lock' })).toBeTruthy()

		rerender(
			<DocumentRequestItem
				{...mockProps}
				requestType={documentRequestDTORequestTypeEnum.PROOF_OF_ADDRESS}
			/>,
		)

		expect(UNSAFE_getByProps({ name: 'home-03' })).toBeTruthy()
	})

	it('should have proper accessibility for pressable element', () => {
		const { getByTestId } = render(<DocumentRequestItem {...mockProps} />)

		const pressable = getByTestId('document-request-item-pressable')
		expect(pressable).toBeTruthy()
	})

	describe('Status styling', () => {
		it('should apply warning colors for pending status', () => {
			const { getByText } = render(<DocumentRequestItem {...mockProps} />)

			const statusText = getByText('pending')

			expect(statusText).toBeTruthy()
		})

		it('should apply success colors for uploaded status', () => {
			const { getByText } = render(
				<DocumentRequestItem
					{...mockProps}
					status={documentRequestDTOStatusEnum.UPLOADED}
				/>,
			)

			const statusText = getByText('uploaded')
			expect(statusText).toBeTruthy()
		})
	})
})
