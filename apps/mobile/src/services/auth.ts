import { createAuthClient } from 'better-auth/react'
import { expoClient } from '@better-auth/expo/client'
import * as SecureStore from 'expo-secure-store'
import {
	emailOTPClient,
	phoneNumberClient,
	twoFactorClient,
} from 'better-auth/client/plugins'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333'

export const authClient = createAuthClient({
	baseURL: API_URL,
	fetchOptions: {
		headers: {
			Origin: API_URL,
		},
	},
	plugins: [
		phoneNumberClient(),
		emailOTPClient(),
		twoFactorClient(),
		expoClient({
			scheme: 'leaselink',
			storagePrefix: 'leaselink',
			storage: SecureStore,
		}),
	],
})
