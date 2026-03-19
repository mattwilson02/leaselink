import { StyleSheet, View, type ViewProps } from 'react-native'

export const GroupInput = ({ style = {}, ...rest }: ViewProps) => {
	return (
		<View
			testID='test-group-input'
			style={[styles.container, style]}
			{...rest}
		/>
	)
}

const styles = StyleSheet.create({
	container: {
		gap: 4,
	},
})
