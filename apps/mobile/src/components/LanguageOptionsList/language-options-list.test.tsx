import { render, fireEvent } from '@testing-library/react-native'
import { LanguageOptionsList } from '.'
import { Languages } from '../../../src/i18n'
import { Select } from '@sf-digital-ui/react-native'

describe('LanguageOptionsList', () => {
	const languageOptions = [
		{ label: 'en', value: Languages.GB },
		{ label: 'es', value: Languages.ES },
		{ label: 'fr', value: Languages.FR },
		{ label: 'de', value: Languages.DE },
	]

	const renderWithSelectProvider = (component: React.ReactNode) => {
		return render(
			<Select.Root value='' onValueChange={() => {}}>
				<Select.Trigger testID='select-trigger' />
				{component}
			</Select.Root>,
		)
	}

	it('should render language options correctly', () => {
		const { getByTestId, getAllByTestId } = renderWithSelectProvider(
			<LanguageOptionsList languageOptions={languageOptions} />,
		)

		// Open the dropdown
		fireEvent.press(getByTestId('select-trigger'))

		// Verify that all language options are rendered with correct testIDs
		expect(getAllByTestId(/select-language-/).length).toBe(
			languageOptions.length,
		)
		expect(getAllByTestId('select-language-gb').length).toBe(1)
		expect(getAllByTestId('select-language-es').length).toBe(1)
		expect(getAllByTestId('select-language-fr').length).toBe(1)
		expect(getAllByTestId('select-language-de').length).toBe(1)
	})

	it('should render language options with translated labels', () => {
		const { getByTestId, getByText } = renderWithSelectProvider(
			<LanguageOptionsList languageOptions={languageOptions} />,
		)

		// Open the dropdown
		fireEvent.press(getByTestId('select-trigger'))

		// Verify that all language labels are translated correctly
		expect(getByText('en')).toBeTruthy()
		expect(getByText('es')).toBeTruthy()
		expect(getByText('fr')).toBeTruthy()
		expect(getByText('de')).toBeTruthy()
	})

	it('should handle empty languageOptions', () => {
		const { queryByTestId } = renderWithSelectProvider(
			<LanguageOptionsList languageOptions={[]} />,
		)

		// Verify that no language options are rendered
		expect(queryByTestId(/select-language-/)).toBeNull()
	})
})
