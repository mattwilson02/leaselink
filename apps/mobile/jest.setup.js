import '@testing-library/jest-native'

jest.mock('expo-local-authentication')

jest.mock('expo-localization', () => ({
	getLocales: jest.fn(() => [
		{
			languageCode: 'en',
			languageTag: 'en-US',
			regionCode: 'US',
			currencyCode: 'USD',
			currencySymbol: '$',
			decimalSeparator: '.',
			digitGroupingSeparator: ',',
		},
	]),
}))

jest.mock('expo-secure-store', () => ({
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
	deleteItemAsync: jest.fn(),
	isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}))

jest.mock('i18next', () => ({
	changeLanguage: jest.fn().mockResolvedValue({}),
	t: jest.fn((key) => key),
	exists: jest.fn(() => true),
}))

jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key) => key,
		errorT: (key) => key,
	}),
	withTranslation: () => (component) => {
		component.defaultProps = {
			t: (key) => key,
			i18n: {
				changeLanguage: jest.fn().mockResolvedValue({}),
			},
		}
		return component
	},
	i18n: {
		changeLanguage: jest.fn(),
		language: 'en',
	},
}))

jest.mock('expo-font', () => ({
	isLoaded: () => [true],
	useFonts: () => [true],
	loadAsync: () => Promise.resolve(),
}))

jest.mock('expo-asset', () => ({
	Asset: {
		loadAsync: () => Promise.resolve(),
	},
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
	getItem: jest.fn(),
	setItem: jest.fn(),
	removeItem: jest.fn(),
}))

jest.mock('@tanstack/react-query', () => ({
	useMutation: jest.fn(() => ({
		mutateAsync: jest.fn(),
		isPending: false,
	})),
	useInfiniteQuery: jest.fn(),
	useQuery: jest.fn(() => ({
		data: [],
		isFetching: false,
	})),
	QueryClient: jest.fn(),
	QueryClientProvider: jest.fn(({ children }) => children),
}))

jest.mock('expo-splash-screen', () => ({
	preventAutoHideAsync: jest.fn(),
	hideAsync: jest.fn(),
}))

jest.mock('@/components/Icon/Background', () => 'SvgMock')
jest.mock('@/components/Icon/Icon', () => 'SvgMock')
jest.mock('@/assets/icons/cloud-with-hourglass.svg', () => 'SvgMock')
jest.mock('@/assets/icons/square-background.svg', () => 'SvgMock')
jest.mock('@/assets/icons/arrow-left.svg', () => 'SvgMock')
jest.mock('@/assets/images/sf-logo-vertical.svg', () => 'SvgMock')
jest.mock('@/assets/icons/doc.svg', () => 'SvgMock')

jest.mock('@/components/Icon', () => ({
	Icon: {
		Root: 'View',
		Background: () => 'SvgMock',
		IconContainer: 'View',
		Icon: () => 'SvgMock',
	},
}))

jest.mock('@/hooks/useColorScheme', () => ({
	useColorScheme: () => 'light',
}))

jest.mock('@/gen/index', () => ({
	useAuthControllerHandle: jest.fn(),
	unifiedUserDTOStatusEnum: {
		// biome-ignore lint/style/useNamingConvention: <explanation>
		INVITED: 'INVITED',
		// biome-ignore lint/style/useNamingConvention: <explanation>
		ACTIVE: 'ACTIVE',
		// biome-ignore lint/style/useNamingConvention: <explanation>
		INACTIVE: 'INACTIVE',
	},
	unifiedUserDTOOnboardingStatusEnum: {
		// biome-ignore lint/style/useNamingConvention: <explanation>
		NEW: 'NEW',
		// biome-ignore lint/style/useNamingConvention: <explanation>
		EMAIL_VERIFIED: 'EMAIL_VERIFIED',
		// biome-ignore lint/style/useNamingConvention: <explanation>
		PHONE_VERIFIED: 'PHONE_VERIFIED',
		// biome-ignore lint/style/useNamingConvention: <explanation>
		PASSWORD_SET: 'PASSWORD_SET',
		// biome-ignore lint/style/useNamingConvention: <explanation>
		ONBOARDED: 'ONBOARDED',
	},
}))

jest.mock('expo-router', () => ({
	useRouter: jest.fn(() => ({
		push: jest.fn(),
		replace: jest.fn(),
		back: jest.fn(),
	})),
	useLocalSearchParams: jest.fn(),
}))

// Better Auth
jest.mock('@/services/auth', () => ({
	authClient: {
		signIn: {
			email: jest.fn(),
			emailOtp: jest.fn(),
		},
		useSession: jest.fn(),
		signOut: jest.fn(),
		changePassword: jest.fn(),
		phoneNumber: {
			sendOtp: jest.fn(),
			verify: jest.fn(),
		},
		emailOtp: {
			sendVerificationOtp: jest.fn(),
		},
		resetPassword: jest.fn(),
		requestPasswordReset: jest.fn(),
	},
}))

global.console = {
	...console,
	error: jest.fn(),
	warn: jest.fn(),
}

jest.mock('@shopify/flash-list', () => {
	const actualFlashList = jest.requireActual('react-native').FlatList
	class MockFlashList extends actualFlashList {
		static displayName = 'FlashList'
	}
	return {
		FlashList: MockFlashList,
	}
})
