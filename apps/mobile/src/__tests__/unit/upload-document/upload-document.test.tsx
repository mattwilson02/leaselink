import { render, fireEvent, waitFor } from '@/utils/test-utils'
import UploadDocument from '@/app/(main)/upload-document'
import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import {
	useAuthControllerHandle,
	useGetDocumentRequestByIdControllerHandle,
	useUploadDocumentControllerHandle,
	useConfirmUploadDocumentControllerHandle,
} from '@/gen/index'
import { act } from 'react'

// Mock the API services
jest.mock('@/services/api', () => ({
	// biome-ignore lint/style/useNamingConvention: Config is opinionated
	__esModule: true,
	default: {
		get: jest.fn(),
		post: jest.fn(),
		put: jest.fn(),
		patch: jest.fn(),
		delete: jest.fn(),
		request: jest.fn(),
	},
	client: jest.fn(),
}))

// Mock the generated API hooks
jest.mock('@/gen/index', () => ({
	useAuthControllerHandle: jest.fn(),
	useGetDocumentRequestByIdControllerHandle: jest.fn(),
	useUploadDocumentControllerHandle: jest.fn(),
	useConfirmUploadDocumentControllerHandle: jest.fn(),
}))

// Mock expo-router
jest.mock('expo-router', () => ({
	useRouter: jest.fn(() => ({
		back: jest.fn(),
		push: jest.fn(),
		replace: jest.fn(),
	})),
	useLocalSearchParams: jest.fn(() => ({
		requestId: 'test-request-id',
	})),
}))

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
	requestMediaLibraryPermissionsAsync: jest.fn(),
	requestCameraPermissionsAsync: jest.fn(),
	launchCameraAsync: jest.fn(),
	launchImageLibraryAsync: jest.fn(),
	MediaTypeOptions: {
		Images: 'Images',
	},
}))

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
	getDocumentAsync: jest.fn(),
}))

// Mock the Icon component
jest.mock('@/components/Icon', () => ({
	Icon: {
		Root: ({ children }: { children: React.ReactNode }) => children,
		IconContainer: ({ children }: { children: React.ReactNode }) => children,
		Icon: ({ name }: { name: string }) => {
			// biome-ignore lint/style/useNamingConvention: React Component
			const MockView = require('react-native').View
			return <MockView testID={`icon-${name}`} />
		},
	},
}))

// Mock the Layout component
jest.mock('@/components/Layout', () => ({
	Layout: {
		SafeAreaView: ({
			children,
			...props
		}: { children: React.ReactNode; [key: string]: unknown }) => {
			// biome-ignore lint/style/useNamingConvention: React Component
			const MockView = require('react-native').View
			return (
				<MockView testID='safe-area-view' {...props}>
					{children}
				</MockView>
			)
		},
	},
}))

jest.mock('@tanstack/react-query', () => ({
	...jest.requireActual('@tanstack/react-query'),
	useQueryClient: jest.fn(() => ({
		invalidateQueries: jest.fn(),
	})),
}))

// Mock the ErrorModal component
jest.mock('@/components/ErrorModal', () => ({
	ErrorModal: function ErrorModal({
		showModal,
		setShowModal,
		errorMessage,
	}: {
		showModal: boolean
		setShowModal: (show: boolean) => void
		errorMessage: string | null
	}) {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockView = require('react-native').View
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockText = require('react-native').Text

		return showModal ? (
			<MockView testID='error-modal' onPress={() => setShowModal(false)}>
				<MockText testID='error-message'>{errorMessage}</MockText>
			</MockView>
		) : null
	},
}))

// Mock document request icons
jest.mock('@/components/Documents/DocumentRequestItem', () => ({
	requestTypeIcon: {
		// biome-ignore lint/style/useNamingConvention: API enum
		PROOF_OF_ADDRESS: {
			name: 'file-text',
			strokeWidth: 2,
		},
		// biome-ignore lint/style/useNamingConvention: API enum
		PROOF_OF_IDENTITY: {
			name: 'user',
			strokeWidth: 2,
		},
	},
}))

// Mock DocIcon
jest.mock('@/assets/icons/doc.svg', () => {
	return function DocIcon() {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockView = require('react-native').View
		return <MockView testID='doc-icon' />
	}
})

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => ({
	Trash: ({ onPress }: { onPress: () => void }) => {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockPressable = require('react-native').Pressable
		return (
			<MockPressable testID='trash-icon' onPress={onPress}>
				<MockPressable />
			</MockPressable>
		)
	},
	X: ({ onPress }: { onPress: () => void }) => {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockPressable = require('react-native').Pressable
		return (
			<MockPressable testID='x-icon' onPress={onPress}>
				<MockPressable />
			</MockPressable>
		)
	},
	CheckCircle: () => {
		// biome-ignore lint/style/useNamingConvention: React Component
		const MockView = require('react-native').View
		return <MockView testID='check-circle-icon' />
	},
}))

// Mock Alert
jest.spyOn(Alert, 'alert')

// Mock fetch
global.fetch = jest.fn()

// Define types for Alert options
interface AlertOption {
	text: string
	onPress?: () => void
	style?: string
}

const mockRouter = {
	back: jest.fn(),
	push: jest.fn(),
	replace: jest.fn(),
}

// Helper function to simulate alert option selection
const selectAlertOption = async (optionText: string) => {
	await waitFor(() => {
		expect(Alert.alert).toHaveBeenCalled()
	})

	const alertCall = (Alert.alert as jest.Mock).mock.calls[0]
	const option = alertCall[2].find(
		(opt: AlertOption) => opt.text === optionText,
	)

	if (option?.onPress) {
		await act(async () => {
			option.onPress?.()
		})
	}
}

describe('UploadDocument Component', () => {
	const mockUser = {
		id: 'test-user-id',
	}

	const mockDocumentRequest = {
		id: 'test-request-id',
		requestType: 'PROOF_OF_ADDRESS',
		status: 'PENDING',
		clientId: 'test-client-id',
		documentId: '1',
		createdAt: '2024-01-15T10:30:00Z',
		updatedAt: '2024-01-15T10:30:00Z',
	}

	const mockUploadUrlResponse = {
		uploadUrl:
			'http://backend-blob-storage:10000/devstoreaccount1/test-container/test-blob-name',
	}

	const mockSelectedFile = {
		id: 1,
		uri: 'file://test-uri',
		fileName: 'test-file.jpg',
		fileSize: 1024,
		mimeType: 'image/jpeg',
	}

	beforeEach(() => {
		jest.clearAllMocks()
		;(useAuthControllerHandle as jest.Mock).mockReturnValue({
			data: mockUser,
		})
		;(useGetDocumentRequestByIdControllerHandle as jest.Mock).mockReturnValue({
			data: mockDocumentRequest,
			isLoading: false,
		})
		;(useUploadDocumentControllerHandle as jest.Mock).mockReturnValue({
			mutateAsync: jest.fn().mockResolvedValue(mockUploadUrlResponse),
		})
		;(useConfirmUploadDocumentControllerHandle as jest.Mock).mockReturnValue({
			mutateAsync: jest.fn().mockResolvedValue({}),
		})
		;(require('expo-router').useRouter as jest.Mock).mockReturnValue(mockRouter)
		;(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			status: 201,
			blob: () => Promise.resolve(new Blob()),
		})
	})

	describe('User Authentication', () => {
		it('should render when user is authenticated', () => {
			const { getByText } = render(<UploadDocument />)
			expect(getByText('PROOF_OF_ADDRESS')).toBeTruthy()
			expect(getByText('upload_document_description')).toBeTruthy()
		})
	})

	describe('Loading State', () => {
		it('should show loading when document request is loading', () => {
			;(useGetDocumentRequestByIdControllerHandle as jest.Mock).mockReturnValue(
				{
					data: undefined,
					isLoading: true,
				},
			)

			const { getByText } = render(<UploadDocument />)
			expect(getByText('Loading...')).toBeTruthy()
		})

		it('should hide loading when data is loaded', () => {
			const { queryByText } = render(<UploadDocument />)
			expect(queryByText('Loading...')).toBeNull()
		})
	})

	describe('Empty State', () => {
		it('should show not found message when document request does not exist', () => {
			;(useGetDocumentRequestByIdControllerHandle as jest.Mock).mockReturnValue(
				{
					data: null,
					isLoading: false,
				},
			)

			const { getByText } = render(<UploadDocument />)
			expect(getByText('document_request_not_found')).toBeTruthy()
		})
	})

	describe('Header Section', () => {
		it('should render header with correct elements', () => {
			const { getByText, getByTestId } = render(<UploadDocument />)

			expect(getByText('PROOF_OF_ADDRESS')).toBeTruthy()
			expect(getByText('upload_document_description')).toBeTruthy()
			expect(getByTestId('x-icon')).toBeTruthy()
		})

		it('should render document type icon in header', () => {
			const { getByTestId } = render(<UploadDocument />)
			expect(getByTestId('icon-file-text')).toBeTruthy()
		})

		it('should call router.back when back button is pressed', () => {
			const { getByTestId } = render(<UploadDocument />)
			const backButton = getByTestId('x-icon')

			fireEvent.press(backButton)
			expect(mockRouter.back).toHaveBeenCalledTimes(1)
		})
	})

	describe('File Selection', () => {
		beforeEach(() => {
			;(
				ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
			).mockResolvedValue({
				status: 'granted',
			})
		})

		it('should show file source selection alert when upload button is pressed', async () => {
			const { getByText } = render(<UploadDocument />)
			const uploadButton = getByText('click_to_upload')

			fireEvent.press(uploadButton)

			await waitFor(() => {
				expect(Alert.alert).toHaveBeenCalledWith(
					'select_source',
					'select_source_document',
					expect.arrayContaining([
						expect.objectContaining({ text: 'camera' }),
						expect.objectContaining({ text: 'photo_library' }),
						expect.objectContaining({ text: 'files' }),
						expect.objectContaining({ text: 'cancel' }),
					]),
				)
			})
		})

		it('should request camera permissions when taking photo', async () => {
			;(
				ImagePicker.requestCameraPermissionsAsync as jest.Mock
			).mockResolvedValue({
				status: 'granted',
			})
			;(ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
				canceled: false,
				assets: [mockSelectedFile],
			})

			const { getByText } = render(<UploadDocument />)
			const uploadButton = getByText('click_to_upload')

			fireEvent.press(uploadButton)

			// Wait for alert to be called, then simulate selecting camera option
			await waitFor(() => {
				expect(Alert.alert).toHaveBeenCalled()
			})

			const alertCall = (Alert.alert as jest.Mock).mock.calls[0]
			const cameraOption = alertCall[2].find(
				(option: AlertOption) => option.text === 'camera',
			)
			cameraOption?.onPress?.()

			await waitFor(() => {
				expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled()
				expect(ImagePicker.launchCameraAsync).toHaveBeenCalled()
			})
		})

		it('should launch image library when photo library is selected', async () => {
			;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
				canceled: false,
				assets: [mockSelectedFile],
			})

			const { getByText } = render(<UploadDocument />)
			const uploadButton = getByText('click_to_upload')

			fireEvent.press(uploadButton)

			// Simulate selecting photo library option
			await selectAlertOption('photo_library')

			await waitFor(() => {
				expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled()
			})
		})

		it('should launch document picker when files is selected', async () => {
			;(DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
				canceled: false,
				assets: [mockSelectedFile],
			})

			const { getByText } = render(<UploadDocument />)
			const uploadButton = getByText('click_to_upload')

			fireEvent.press(uploadButton)

			// Simulate selecting files option
			await selectAlertOption('files')

			await waitFor(() => {
				expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith({
					type: ['image/*', 'application/pdf'],
					copyToCacheDirectory: true,
				})
			})
		})
	})

	describe('Selected File Display', () => {
		beforeEach(() => {
			;(
				ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
			).mockResolvedValue({
				status: 'granted',
			})
		})

		it('should display selected file information', async () => {
			;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
				canceled: false,
				assets: [mockSelectedFile],
			})

			const { getByText, getByTestId } = render(<UploadDocument />)
			const uploadButton = getByText('click_to_upload')

			fireEvent.press(uploadButton)

			// Simulate selecting photo library option
			await selectAlertOption('photo_library')

			await waitFor(() => {
				expect(getByText('test-file.jpg')).toBeTruthy()
				expect(getByText('1 KB')).toBeTruthy()
				expect(getByTestId('doc-icon')).toBeTruthy()
				expect(getByTestId('trash-icon')).toBeTruthy()
			})
		})

		it('should remove selected file when trash icon is pressed', async () => {
			;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
				canceled: false,
				assets: [mockSelectedFile],
			})

			const { getByText, getByTestId, queryByText } = render(<UploadDocument />)
			const uploadButton = getByText('click_to_upload')

			fireEvent.press(uploadButton)

			// Simulate selecting photo library option
			await selectAlertOption('photo_library')

			await waitFor(() => {
				expect(getByText('test-file.jpg')).toBeTruthy()
			})

			const trashIcon = getByTestId('trash-icon')
			fireEvent.press(trashIcon)

			await waitFor(() => {
				expect(queryByText('test-file.jpg')).toBeNull()
			})
		})
	})

	describe('File Upload Process', () => {
		beforeEach(async () => {
			;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
				canceled: false,
				assets: [mockSelectedFile],
			})
		})

		it('should upload file successfully', async () => {
			const { getByText } = render(<UploadDocument />)
			const uploadButton = getByText('click_to_upload')

			fireEvent.press(uploadButton)

			// Select file
			await selectAlertOption('photo_library')

			await waitFor(() => {
				expect(getByText('test-file.jpg')).toBeTruthy()
			})

			// Upload file
			const confirmButton = getByText('confirm')
			fireEvent.press(confirmButton)

			await waitFor(() => {
				expect(
					useUploadDocumentControllerHandle().mutateAsync,
				).toHaveBeenCalledWith({
					data: { documentRequestId: 'test-request-id' },
				})
				expect(global.fetch).toHaveBeenCalledWith(
					'http://localhost:10000/devstoreaccount1/test-container/test-blob-name',
					expect.objectContaining({
						method: 'PUT',
						headers: expect.objectContaining({
							'Content-Type': 'image/jpeg',
							'x-ms-blob-type': 'BlockBlob',
						}),
					}),
				)
			})
		})

		it('should confirm upload with backend after successful upload', async () => {
			const { getByText } = render(<UploadDocument />)
			const uploadButton = getByText('click_to_upload')

			fireEvent.press(uploadButton)

			// Select file
			await selectAlertOption('photo_library')

			await waitFor(() => {
				expect(getByText('test-file.jpg')).toBeTruthy()
			})

			// Upload file
			const confirmButton = getByText('confirm')
			fireEvent.press(confirmButton)

			await waitFor(() => {
				expect(
					useConfirmUploadDocumentControllerHandle().mutateAsync,
				).toHaveBeenCalledWith({
					data: {
						documentRequestId: 'test-request-id',
						uploadedBy: 'test-user-id',
						clientId: 'test-user-id',
						contentKey: undefined,
						thumbnailBlobName: undefined,
						fileSize: 1,
						folder: 'inbox',
						name: 'test-file.jpg',
						blobName: 'test-blob-name',
					},
				})
			})
		})

		it('should show success modal after successful upload', async () => {
			const { getByText, getByTestId } = render(<UploadDocument />)
			const uploadButton = getByText('click_to_upload')

			fireEvent.press(uploadButton)

			// Select file
			await selectAlertOption('photo_library')

			await waitFor(() => {
				expect(getByText('test-file.jpg')).toBeTruthy()
			})

			// Upload file
			const confirmButton = getByText('confirm')
			fireEvent.press(confirmButton)

			await waitFor(() => {
				expect(getByTestId('modal-title')).toBeTruthy()
				expect(getByTestId('modal-description')).toBeTruthy()
			})
		})
	})

	describe('Error Handling', () => {
		it('should show error modal when upload fails', async () => {
			;(global.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				status: 500,
			})
			;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
				canceled: false,
				assets: [mockSelectedFile],
			})

			const { getByText, getByTestId } = render(<UploadDocument />)
			const uploadButton = getByText('click_to_upload')

			fireEvent.press(uploadButton)

			// Select file
			await selectAlertOption('photo_library')

			await waitFor(() => {
				expect(getByText('test-file.jpg')).toBeTruthy()
			})

			// Upload file
			const confirmButton = getByText('confirm')
			fireEvent.press(confirmButton)

			await waitFor(() => {
				expect(getByTestId('error-modal')).toBeTruthy()
				expect(getByTestId('error-message')).toBeTruthy()
			})
		})

		it('should show error modal when camera permission is denied', async () => {
			;(
				ImagePicker.requestCameraPermissionsAsync as jest.Mock
			).mockResolvedValue({
				status: 'denied',
			})

			const { getByText, getByTestId } = render(<UploadDocument />)
			const uploadButton = getByText('click_to_upload')

			fireEvent.press(uploadButton)

			// Simulate selecting camera option
			await selectAlertOption('camera')

			await waitFor(() => {
				expect(getByTestId('error-modal')).toBeTruthy()
				expect(getByText('Camera permission is needed!')).toBeTruthy()
			})
		})

		it('should handle media library permission denial', async () => {
			;(
				ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
			).mockResolvedValue({
				status: 'denied',
			})

			const { getByText } = render(<UploadDocument />)
			const uploadButton = getByText('click_to_upload')

			fireEvent.press(uploadButton)

			await waitFor(() => {
				expect(Alert.alert).toHaveBeenCalledWith(
					'permission_required',
					'permission_camera_roll',
				)
			})
		})
	})

	describe('Navigation', () => {
		it('should have back button functionality', () => {
			const { getByTestId } = render(<UploadDocument />)
			const backButton = getByTestId('x-icon')

			fireEvent.press(backButton)
			expect(mockRouter.back).toHaveBeenCalledTimes(1)
		})

		it('should have cancel button functionality', () => {
			const { getByText } = render(<UploadDocument />)
			const cancelButton = getByText('cancel')

			fireEvent.press(cancelButton)
			expect(mockRouter.back).toHaveBeenCalledTimes(1)
		})

		it('should navigate to document requests after successful upload', async () => {
			;(
				ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
			).mockResolvedValue({
				status: 'granted',
			})
			;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
				canceled: false,
				assets: [mockSelectedFile],
			})

			const { getByText } = render(<UploadDocument />)
			const uploadButton = getByText('click_to_upload')

			fireEvent.press(uploadButton)

			// Select file
			await selectAlertOption('photo_library')

			await waitFor(() => {
				expect(getByText('test-file.jpg')).toBeTruthy()
			})

			// Upload file
			const confirmButton = getByText('confirm')
			fireEvent.press(confirmButton)

			await waitFor(() => {
				// Find the continue button in the success modal
				const modalContinueButton = getByText('continue')
				fireEvent.press(modalContinueButton)
				expect(mockRouter.push).toHaveBeenCalledWith('/document-requests')
			})
		})
	})

	describe('Layout and Styling', () => {
		it('should render with correct layout structure', () => {
			const { getByTestId } = render(<UploadDocument />)
			const layoutView = getByTestId('layout-view')

			expect(layoutView).toBeTruthy()
			expect(layoutView.props.style).toEqual(
				expect.objectContaining({
					backgroundColor: 'white',
					flex: 1,
					gap: 20,
				}),
			)
		})
	})

	describe('Component Integration', () => {
		it('should integrate properly with Layout.SafeAreaView', () => {
			const { getByTestId } = render(<UploadDocument />)
			const safeAreaView = getByTestId('layout-view')
			expect(safeAreaView).toBeTruthy()
		})

		it('should integrate properly with Icon components', () => {
			const { getByTestId } = render(<UploadDocument />)
			expect(getByTestId('icon-file-text')).toBeTruthy()
			expect(getByTestId('icon-upload-cloud-02')).toBeTruthy()
		})
	})

	describe('API Query Configuration', () => {
		it('should call getDocumentRequestById with correct parameters', () => {
			render(<UploadDocument />)

			expect(useGetDocumentRequestByIdControllerHandle).toHaveBeenCalledWith(
				'test-request-id',
			)
		})

		it('should call uploadDocument with correct parameters', async () => {
			;(
				ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock
			).mockResolvedValue({
				status: 'granted',
			})
			;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
				canceled: false,
				assets: [mockSelectedFile],
			})

			const { getByText } = render(<UploadDocument />)
			const uploadButton = getByText('click_to_upload')

			fireEvent.press(uploadButton)

			// Select file
			await selectAlertOption('photo_library')

			await waitFor(() => {
				expect(getByText('test-file.jpg')).toBeTruthy()
			})

			// Upload file
			const confirmButton = getByText('confirm')
			fireEvent.press(confirmButton)

			await waitFor(() => {
				expect(
					useUploadDocumentControllerHandle().mutateAsync,
				).toHaveBeenCalledWith({
					data: { documentRequestId: 'test-request-id' },
				})
			})
		})
	})
})
