import AsyncStorage from '@react-native-async-storage/async-storage'
import { getLocales } from 'expo-localization'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import gb from './translations/gb'
import es from './translations/es'
import fr from './translations/fr'
import de from './translations/de'

export enum Languages {
	GB = 'gb',
	ES = 'es',
	FR = 'fr',
	DE = 'de',
}

export const languageOptions = [
	{ label: 'en', value: Languages.GB },
	{ label: 'es', value: Languages.ES },
	{ label: 'fr', value: Languages.FR },
	{ label: 'de', value: Languages.DE },
]

const LANGUAGE_STORAGE_KEY = 'user-language'

export const initializeI18n = async () => {
	try {
		const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)

		await i18next.use(initReactI18next).init({
			fallbackLng: Languages.GB,
			lng: storedLanguage || Languages.GB,
			supportedLngs: [Languages.GB, Languages.ES, Languages.FR, Languages.DE],
			resources: {
				gb,
				es,
				fr,
				de,
			},
		})

		return i18next
	} catch (error) {
		console.error('Failed to initialize i18n:', error)

		await i18next.use(initReactI18next).init({
			fallbackLng: Languages.GB,
			lng: getLocales()[0].languageCode || Languages.GB,
			supportedLngs: [Languages.GB, Languages.ES, Languages.FR, Languages.DE],
			resources: {
				gb,
				es,
				fr,
				de,
			},
		})

		return i18next
	}
}

export const changeLanguage = async (language: string) => {
	try {
		await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language)
		await i18next.changeLanguage(language)
	} catch (error) {
		console.error('Error changing language:', error)
	}
}

export default i18next
