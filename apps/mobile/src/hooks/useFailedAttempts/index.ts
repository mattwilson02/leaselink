import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'

export const FAILED_ATTEMPTS_KEY = 'confirmEmailFailedAttempts'
const MAX_ATTEMPTS = 3
export const useFailedAttempts = () => {
	const router = useRouter()
	const [failedAttempts, setFailedAttempts] = useState(0)
	useEffect(() => {
		const loadFailedAttempts = async () => {
			try {
				const storedAttempts = await AsyncStorage.getItem(FAILED_ATTEMPTS_KEY)
				if (storedAttempts !== null) {
					setFailedAttempts(Number.parseInt(storedAttempts, 10))
				}
			} catch (error) {
				console.error('Error loading failed attempts:', error)
			}
		}

		loadFailedAttempts()
	}, [])

	useEffect(() => {
		if (failedAttempts >= MAX_ATTEMPTS) {
			router.replace('/(onboarding)/too-many-attempts')
		}
	}, [failedAttempts, router])

	const updateFailedAttempts = async (attempts: number) => {
		try {
			await AsyncStorage.setItem(FAILED_ATTEMPTS_KEY, attempts.toString())
			setFailedAttempts(attempts)
		} catch (error) {
			console.error('Error saving failed attempts:', error)
		}
	}

	const resetFailedAttempts = async () => {
		try {
			await AsyncStorage.removeItem(FAILED_ATTEMPTS_KEY)
			setFailedAttempts(0)
		} catch (error) {
			console.error('Error resetting failed attempts:', error)
		}
	}

	return {
		MAX_ATTEMPTS,
		failedAttempts,
		updateFailedAttempts,
		resetFailedAttempts,
	}
}
