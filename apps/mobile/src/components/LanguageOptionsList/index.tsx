import { Select } from '@sf-digital-ui/react-native'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import type { Languages } from '../../../src/i18n'
import CountryFlag from 'react-native-country-flag'

export const LanguageOptionsList = ({
	languageOptions,
}: {
	languageOptions: {
		label: string
		value: Languages
	}[]
}) => {
	const { t } = useTranslation('choose_language')

	return languageOptions.map((option) => {
		return (
			<Select.Item
				key={option.value}
				value={option.value}
				style={styles.selectItem}
				testID={`select-language-${option.value}`}
			>
				<CountryFlag isoCode={option.value} size={20} />
				<Select.ItemText>{t(option.label)}</Select.ItemText>
			</Select.Item>
		)
	})
}

const styles = StyleSheet.create({
	selectItem: {
		justifyContent: 'flex-start',
		gap: 8,
		alignItems: 'center',
	},
})
