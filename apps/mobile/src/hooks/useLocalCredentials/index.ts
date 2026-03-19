import { useState, useEffect, useCallback } from 'react'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'

interface Credentials {
	identifier: string
	password: string
}

interface UseLocalCredentialsReturn {
	hasCredentials: boolean
	userOwnsCredentials: boolean
	biometricType: 'face-recognition' | 'fingerprint' | null
	setCredentials: (credentials: Credentials) => Promise<void>
	authenticate: () => Promise<Credentials | null>
	clearCredentials: () => Promise<void>
}

interface UseLocalCredentialsOptions {
	currentUserIdentifier?: string // Email or username of currently logged in user
	secureStoreKey?: string // Custom key for SecureStore
}

export function useLocalCredentials(
	options: UseLocalCredentialsOptions = {},
): UseLocalCredentialsReturn {
	const { currentUserIdentifier, secureStoreKey = 'local_credentials' } =
		options

	// Metadata key to check existence without authentication
	const metadataKey = `${secureStoreKey}_metadata`

	const [hasCredentials, setHasCredentials] = useState(false)
	const [userOwnsCredentials, setUserOwnsCredentials] = useState(false)
	const [biometricType, setBiometricType] = useState<
		'face-recognition' | 'fingerprint' | null
	>(null)

	// Check for stored credentials and biometric support on mount
	useEffect(() => {
		checkCredentialsAndBiometrics()
	}, [])

	const checkCredentialsAndBiometrics = async () => {
		try {
			// Check if biometrics are available
			const compatible = await LocalAuthentication.hasHardwareAsync()
			const enrolled = await LocalAuthentication.isEnrolledAsync()
			if (compatible && enrolled) {
				const types =
					await LocalAuthentication.supportedAuthenticationTypesAsync()

				if (
					types.includes(
						LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
					)
				) {
					setBiometricType('face-recognition')
				} else if (
					types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
				) {
					setBiometricType('fingerprint')
				}
			}

			// Check metadata to see if credentials exist (no auth required)
			const metadata = await SecureStore.getItemAsync(metadataKey, {
				requireAuthentication: false,
			})

			if (metadata) {
				const { hasCredentials: stored, userIdentifier } = JSON.parse(metadata)

				setHasCredentials(stored)

				// Check ownership without accessing actual credentials
				if (currentUserIdentifier && userIdentifier) {
					setUserOwnsCredentials(userIdentifier === currentUserIdentifier)
				} else {
					setUserOwnsCredentials(false)
				}
			} else {
				setHasCredentials(false)
				setUserOwnsCredentials(false)
			}
		} catch (error) {
			console.error('Error checking credentials:', error)
			setHasCredentials(false)
			setUserOwnsCredentials(false)
		}
	}

	const setCredentials = useCallback(
		async (credentials: Credentials): Promise<void> => {
			try {
				// Check if biometrics are available
				const compatible = await LocalAuthentication.hasHardwareAsync()
				const enrolled = await LocalAuthentication.isEnrolledAsync()

				if (!compatible || !enrolled) {
					throw new Error(
						'Biometric authentication is not available on this device',
					)
				}

				// Platform-specific secure storage options
				// On iOS: requireAuthentication works reliably with Face ID/Touch ID
				// On Android: Use WHEN_UNLOCKED_THIS_DEVICE_ONLY which requires device authentication
				// but doesn't fail with weak (Class 2) biometrics like some face unlock implementations
				const secureStoreOptions: SecureStore.SecureStoreOptions =
					Platform.OS === 'ios'
						? {
								requireAuthentication: true,
								authenticationPrompt: 'Authenticate to save credentials',
							}
						: {
								keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
							}

				// Store credentials with authentication required
				await SecureStore.setItemAsync(
					secureStoreKey,
					JSON.stringify(credentials),
					secureStoreOptions,
				)

				// Store metadata without authentication required
				// This allows checking for existence without triggering biometrics
				await SecureStore.setItemAsync(
					metadataKey,
					JSON.stringify({
						hasCredentials: true,
						userIdentifier: credentials.identifier,
					}),
					{
						requireAuthentication: false,
						authenticationPrompt: 'Store your password securely',
					},
				)

				setHasCredentials(true)

				// Update ownership if current user is set
				if (currentUserIdentifier) {
					setUserOwnsCredentials(
						credentials.identifier === currentUserIdentifier,
					)
				}
			} catch (error) {
				console.error('Error storing credentials:', error)
				throw error
			}
		},
		[secureStoreKey, metadataKey, currentUserIdentifier],
	)

	const authenticate = useCallback(async (): Promise<Credentials | null> => {
		try {
			// On Android, explicitly authenticate with biometrics first
			// since WHEN_UNLOCKED_THIS_DEVICE_ONLY doesn't prompt for biometrics on retrieval
			if (Platform.OS === 'android') {
				const authResult = await LocalAuthentication.authenticateAsync({
					promptMessage: 'Authenticate to sign in',
					cancelLabel: 'Cancel',
					disableDeviceFallback: false,
				})

				if (!authResult.success) {
					throw new Error('Authentication failed')
				}
			}

			// Platform-specific retrieve options
			const secureStoreOptions: SecureStore.SecureStoreOptions =
				Platform.OS === 'ios'
					? {
							requireAuthentication: true,
							authenticationPrompt: 'Authenticate to sign in',
						}
					: {
							keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
						}

			const storedData = await SecureStore.getItemAsync(
				secureStoreKey,
				secureStoreOptions,
			)

			if (!storedData) {
				throw new Error('No credentials found')
			}

			return JSON.parse(storedData) as Credentials
		} catch (error) {
			console.error('Error authenticating:', error)
			throw error
		}
	}, [secureStoreKey])

	const clearCredentials = useCallback(async (): Promise<void> => {
		try {
			// Delete both credentials and metadata
			// No authentication required for deletion
			await SecureStore.deleteItemAsync(secureStoreKey)
			await SecureStore.deleteItemAsync(metadataKey)
			setUserOwnsCredentials(false)
		} catch (error) {
			console.error('Error clearing credentials:', error)
			throw error
		}
	}, [secureStoreKey, metadataKey])

	return {
		hasCredentials,
		userOwnsCredentials,
		biometricType,
		setCredentials,
		authenticate,
		clearCredentials,
	}
}
