import { renderHook, act, waitFor } from '@/utils/test-utils'
import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { useLocalCredentials } from '.'

jest.mock('expo-secure-store')
jest.mock('expo-local-authentication')

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>
const mockLocalAuth = LocalAuthentication as jest.Mocked<
	typeof LocalAuthentication
>

describe('useLocalCredentials', () => {
	beforeEach(() => {
		jest.clearAllMocks()

		mockLocalAuth.hasHardwareAsync.mockResolvedValue(true)
		mockLocalAuth.isEnrolledAsync.mockResolvedValue(true)
		mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
			LocalAuthentication.AuthenticationType.FINGERPRINT,
		])
		mockSecureStore.getItemAsync.mockResolvedValue(null)
	})

	describe('Initial State', () => {
		it('should initialize with default values when no credentials exist', async () => {
			const { result } = renderHook(() => useLocalCredentials())

			await waitFor(() => {
				expect(result.current.hasCredentials).toBe(false)
				expect(result.current.userOwnsCredentials).toBe(false)
				expect(result.current.biometricType).toBe('fingerprint')
			})
		})

		it('should detect Face ID when available', async () => {
			mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
				LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
			])

			const { result } = renderHook(() => useLocalCredentials())

			await waitFor(() => {
				expect(result.current.biometricType).toBe('face-recognition')
			})
		})

		it('should detect Touch ID/Fingerprint when available', async () => {
			mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
				LocalAuthentication.AuthenticationType.FINGERPRINT,
			])

			const { result } = renderHook(() => useLocalCredentials())

			await waitFor(() => {
				expect(result.current.biometricType).toBe('fingerprint')
			})
		})

		it('should set biometricType to null when no biometrics available', async () => {
			mockLocalAuth.hasHardwareAsync.mockResolvedValue(false)

			const { result } = renderHook(() => useLocalCredentials())

			await waitFor(() => {
				expect(result.current.biometricType).toBe(null)
			})
		})

		it('should set biometricType to null when biometrics not enrolled', async () => {
			mockLocalAuth.isEnrolledAsync.mockResolvedValue(false)

			const { result } = renderHook(() => useLocalCredentials())

			await waitFor(() => {
				expect(result.current.biometricType).toBe(null)
			})
		})

		it('should detect existing credentials', async () => {
			const metadata = JSON.stringify({
				hasCredentials: true,
				userIdentifier: 'user@example.com',
			})
			mockSecureStore.getItemAsync.mockResolvedValue(metadata)

			const { result } = renderHook(() => useLocalCredentials())

			await waitFor(() => {
				expect(result.current.hasCredentials).toBe(true)
			})
		})
	})

	describe('userOwnsCredentials', () => {
		it('should return true when stored credentials match current user', async () => {
			const metadata = JSON.stringify({
				hasCredentials: true,
				userIdentifier: 'user@example.com',
			})
			mockSecureStore.getItemAsync.mockResolvedValue(metadata)

			const { result } = renderHook(() =>
				useLocalCredentials({ currentUserIdentifier: 'user@example.com' }),
			)

			await waitFor(() => {
				expect(result.current.userOwnsCredentials).toBe(true)
			})
		})

		it('should return false when stored credentials do not match current user', async () => {
			const metadata = JSON.stringify({
				hasCredentials: true,
				userIdentifier: 'other@example.com',
			})
			mockSecureStore.getItemAsync.mockResolvedValue(metadata)

			const { result } = renderHook(() =>
				useLocalCredentials({ currentUserIdentifier: 'user@example.com' }),
			)

			await waitFor(() => {
				expect(result.current.userOwnsCredentials).toBe(false)
			})
		})

		it('should return false when no current user identifier provided', async () => {
			const metadata = JSON.stringify({
				hasCredentials: true,
				userIdentifier: 'user@example.com',
			})
			mockSecureStore.getItemAsync.mockResolvedValue(metadata)

			const { result } = renderHook(() => useLocalCredentials())

			await waitFor(() => {
				expect(result.current.userOwnsCredentials).toBe(false)
			})
		})
	})

	describe('setCredentials', () => {
		it('should store credentials successfully', async () => {
			mockSecureStore.setItemAsync.mockResolvedValue(undefined)

			const { result } = renderHook(() => useLocalCredentials())

			await act(async () => {
				await result.current.setCredentials({
					identifier: 'user@example.com',
					password: 'password123',
				})
			})

			// Should store credentials with authentication required
			expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
				'local_credentials',
				JSON.stringify({
					identifier: 'user@example.com',
					password: 'password123',
				}),
				{
					authenticationPrompt: 'Authenticate to save credentials',
					requireAuthentication: true,
				},
			)

			// Should store metadata without authentication required
			expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
				'local_credentials_metadata',
				JSON.stringify({
					hasCredentials: true,
					userIdentifier: 'user@example.com',
				}),
				expect.objectContaining({
					requireAuthentication: false,
				}),
			)
		})

		it('should use custom secure store key', async () => {
			mockSecureStore.setItemAsync.mockResolvedValue(undefined)

			const { result } = renderHook(() =>
				useLocalCredentials({ secureStoreKey: 'custom_key' }),
			)

			await act(async () => {
				await result.current.setCredentials({
					identifier: 'user@example.com',
					password: 'password123',
				})
			})

			expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
				'custom_key',
				expect.any(String),
				{
					authenticationPrompt: 'Authenticate to save credentials',
					requireAuthentication: true,
				},
			)

			expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
				'custom_key_metadata',
				expect.any(String),
				expect.objectContaining({ requireAuthentication: false }),
			)
		})

		it('should update hasCredentials after storing', async () => {
			mockSecureStore.setItemAsync.mockResolvedValue(undefined)

			const { result } = renderHook(() => useLocalCredentials())

			await waitFor(() => {
				expect(result.current.hasCredentials).toBe(false)
			})

			await act(async () => {
				await result.current.setCredentials({
					identifier: 'user@example.com',
					password: 'password123',
				})
			})

			expect(result.current.hasCredentials).toBe(true)
		})

		it('should update userOwnsCredentials when storing for current user', async () => {
			mockSecureStore.setItemAsync.mockResolvedValue(undefined)
			mockSecureStore.getItemAsync.mockResolvedValue(null)

			const { result } = renderHook(() =>
				useLocalCredentials({ currentUserIdentifier: 'user@example.com' }),
			)

			await act(async () => {
				await result.current.setCredentials({
					identifier: 'user@example.com',
					password: 'password123',
				})
			})

			await waitFor(() => {
				expect(result.current.userOwnsCredentials).toBe(true)
			})
		})

		it('should throw error when biometrics not available', async () => {
			mockLocalAuth.hasHardwareAsync.mockResolvedValue(false)

			const { result } = renderHook(() => useLocalCredentials())

			await waitFor(() => {
				expect(result.current.biometricType).toBe(null)
			})

			await expect(
				act(async () => {
					await result.current.setCredentials({
						identifier: 'user@example.com',
						password: 'password123',
					})
				}),
			).rejects.toThrow(
				'Biometric authentication is not available on this device',
			)
		})

		it('should throw error when biometrics not enrolled', async () => {
			mockLocalAuth.isEnrolledAsync.mockResolvedValue(false)

			const { result } = renderHook(() => useLocalCredentials())

			await waitFor(() => {
				expect(result.current.biometricType).toBe(null)
			})

			await expect(
				act(async () => {
					await result.current.setCredentials({
						identifier: 'user@example.com',
						password: 'password123',
					})
				}),
			).rejects.toThrow(
				'Biometric authentication is not available on this device',
			)
		})

		it('should handle SecureStore errors', async () => {
			mockSecureStore.setItemAsync.mockRejectedValue(new Error('Storage error'))

			const { result } = renderHook(() => useLocalCredentials())

			await expect(
				act(async () => {
					await result.current.setCredentials({
						identifier: 'user@example.com',
						password: 'password123',
					})
				}),
			).rejects.toThrow('Storage error')
		})
	})

	describe('authenticate', () => {
		it('should authenticate and retrieve credentials successfully', async () => {
			const metadata = JSON.stringify({
				hasCredentials: true,
				userIdentifier: 'user@example.com',
			})
			const storedCreds = JSON.stringify({
				identifier: 'user@example.com',
				password: 'password123',
			})
			mockSecureStore.getItemAsync
				.mockResolvedValueOnce(metadata) // Initial metadata check
				.mockResolvedValueOnce(storedCreds) // Retrieve credentials with auth

			const { result } = renderHook(() => useLocalCredentials())

			await waitFor(() => {
				expect(result.current.hasCredentials).toBe(true)
			})

			let credentials = null
			await act(async () => {
				credentials = await result.current.authenticate()
			})

			// Should retrieve credentials with requireAuthentication: true
			expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(
				'local_credentials',
				expect.objectContaining({
					requireAuthentication: true,
				}),
			)
			expect(credentials).toEqual({
				identifier: 'user@example.com',
				password: 'password123',
			})
		})

		it('should throw error when no credentials stored', async () => {
			mockSecureStore.getItemAsync.mockResolvedValue(null)

			const { result } = renderHook(() => useLocalCredentials())

			await waitFor(() => {
				expect(result.current.hasCredentials).toBe(false)
			})

			await expect(
				act(async () => {
					await result.current.authenticate()
				}),
			).rejects.toThrow('No credentials found')
		})

		it('should throw error when credentials not found after authentication', async () => {
			const metadata = JSON.stringify({
				hasCredentials: true,
				userIdentifier: 'test@example.com',
			})
			mockSecureStore.getItemAsync
				.mockResolvedValueOnce(metadata) // Initial metadata check
				.mockResolvedValueOnce(null) // Returns null when trying to get credentials

			const { result } = renderHook(() => useLocalCredentials())

			await waitFor(() => {
				expect(result.current.hasCredentials).toBe(true)
			})

			await expect(
				act(async () => {
					await result.current.authenticate()
				}),
			).rejects.toThrow('No credentials found')
		})
	})

	describe('clearCredentials', () => {
		it('should clear credentials successfully', async () => {
			const metadata = JSON.stringify({
				hasCredentials: true,
				userIdentifier: 'user@example.com',
			})
			mockSecureStore.getItemAsync.mockResolvedValue(metadata)
			mockSecureStore.deleteItemAsync.mockResolvedValue(undefined)

			const { result } = renderHook(() =>
				useLocalCredentials({ currentUserIdentifier: 'user@example.com' }),
			)

			await waitFor(() => {
				expect(result.current.hasCredentials).toBe(true)
				expect(result.current.userOwnsCredentials).toBe(true)
			})

			await act(async () => {
				await result.current.clearCredentials()
			})

			expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
				'local_credentials',
			)
			expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
				'local_credentials_metadata',
			)
			expect(result.current.userOwnsCredentials).toBe(false)
		})

		it('should use custom secure store key when clearing', async () => {
			mockSecureStore.deleteItemAsync.mockResolvedValue(undefined)

			const { result } = renderHook(() =>
				useLocalCredentials({ secureStoreKey: 'custom_key' }),
			)

			await act(async () => {
				await result.current.clearCredentials()
			})

			expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('custom_key')
			expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
				'custom_key_metadata',
			)
		})

		it('should handle deletion errors', async () => {
			mockSecureStore.deleteItemAsync.mockRejectedValue(
				new Error('Deletion error'),
			)

			const { result } = renderHook(() => useLocalCredentials())

			await expect(
				act(async () => {
					await result.current.clearCredentials()
				}),
			).rejects.toThrow('Deletion error')
		})
	})

	describe('Error Handling', () => {
		it('should handle errors during initial credential check gracefully', async () => {
			mockSecureStore.getItemAsync.mockRejectedValue(new Error('Read error'))
			const consoleError = jest.spyOn(console, 'error').mockImplementation()

			const { result } = renderHook(() => useLocalCredentials())

			await waitFor(() => {
				expect(result.current.hasCredentials).toBe(false)
				expect(result.current.userOwnsCredentials).toBe(false)
			})

			expect(consoleError).toHaveBeenCalledWith(
				'Error checking credentials:',
				expect.any(Error),
			)

			consoleError.mockRestore()
		})

		it('should handle biometric check errors gracefully', async () => {
			mockLocalAuth.hasHardwareAsync.mockRejectedValue(
				new Error('Hardware error'),
			)
			const consoleError = jest.spyOn(console, 'error').mockImplementation()

			const { result } = renderHook(() => useLocalCredentials())

			await waitFor(() => {
				expect(result.current.biometricType).toBe(null)
			})

			expect(consoleError).toHaveBeenCalled()
			consoleError.mockRestore()
		})
	})
})
