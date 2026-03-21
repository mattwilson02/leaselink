import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from '@react-navigation/native'
import {
	Inter_400Regular,
	Inter_500Medium,
	Inter_600SemiBold,
	Inter_700Bold,
	useFonts,
} from '@expo-google-fonts/inter'
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import 'react-native-reanimated'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useColorScheme } from '@/hooks/useColorScheme'
import { PushNotificationProvider } from '../src/context/push-notification-context'
import '../src/i18n'
import { initializeI18n } from '../src/i18n'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { LogBox } from 'react-native'
import ErrorBoundary from '@/components/ErrorBoundary'

// Selectively ignore known non-critical warnings
LogBox.ignoreLogs([
	'Non-serializable values were found in the navigation state',
	'VirtualizedLists should never be nested',
	'Must use physical device for Push Notifications',
])

SplashScreen.preventAutoHideAsync()

export const queryClient = new QueryClient()

const RootLayout = () => {
	const [isI18nInitialized, setIsI18nInitialized] = useState(false)
	const colorScheme = useColorScheme()

	const [loaded] = useFonts({
		Inter_400Regular,
		Inter_500Medium,
		Inter_600SemiBold,
		Inter_700Bold,
	})

	useEffect(() => {
		const setup = async () => {
			await initializeI18n()
			setIsI18nInitialized(true)
		}

		setup()
	}, [])

	if (!loaded || !isI18nInitialized) {
		return null
	}

	return (
		<>
			<ErrorBoundary>
				<QueryClientProvider client={queryClient}>
					<SafeAreaProvider>
						<GestureHandlerRootView>
							<PushNotificationProvider>
								<ThemeProvider
									value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
								>
									<Slot screenOptions={{ headerShown: false }} />
								</ThemeProvider>
							</PushNotificationProvider>
						</GestureHandlerRootView>
					</SafeAreaProvider>
				</QueryClientProvider>
			</ErrorBoundary>

			<StatusBar style='auto' />
		</>
	)
}

export default RootLayout
