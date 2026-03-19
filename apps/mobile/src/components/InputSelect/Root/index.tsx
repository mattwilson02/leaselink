import { TextInput, type TextInputRootProps } from '@sf-digital-ui/react-native'
import { StyleSheet } from 'react-native'

export const Root = ({ style, ...props }: TextInputRootProps) => {
	return <TextInput.Root style={[styles.rootStyle, style]} {...props} />
}

const styles = StyleSheet.create({
	rootStyle: {
		paddingHorizontal: 0,
		paddingVertical: 0,
		paddingRight: 16,
	},
})
