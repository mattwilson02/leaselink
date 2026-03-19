import { render, renderHook } from '@testing-library/react-native'
import {
	ThemeProvider,
	DefaultTheme,
	DarkTheme,
} from '@react-navigation/native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

interface CustomRenderOptions {
	theme?: 'light' | 'dark'
	isAuthenticated?: boolean
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
})

const AllTheProviders = ({
	children,
	theme = 'light',
}: {
	children: ReactNode
	theme?: 'light' | 'dark'
}) => {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
				{children}
			</ThemeProvider>
		</QueryClientProvider>
	)
}

const customRender = (
	ui: React.ReactElement,
	options: CustomRenderOptions = {},
) => {
	const { theme = 'light', ...renderOptions } = options

	return render(ui, {
		wrapper: ({ children }) => (
			<AllTheProviders theme={theme}>{children}</AllTheProviders>
		),
		...renderOptions,
	})
}

// Custom renderHook function with the same provider setup
const customRenderHook = <Result, Props>(
	hook: (props: Props) => Result,
	options: CustomRenderOptions & { initialProps?: Props } = {},
) => {
	const { theme = 'light', initialProps, ...renderOptions } = options

	return renderHook(hook, {
		wrapper: ({ children }) => (
			<AllTheProviders theme={theme}>{children}</AllTheProviders>
		),
		initialProps,
		...renderOptions,
	})
}

export * from '@testing-library/react-native'
export { customRender as render, customRenderHook as renderHook }
