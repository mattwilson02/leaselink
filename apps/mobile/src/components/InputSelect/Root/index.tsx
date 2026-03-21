import { TextInputCompound } from '@/design-system/components/TextInputCompound'
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

interface RootProps {
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
  testID?: string
}

export const Root = ({ style, children, testID }: RootProps) => {
	return (
		<TextInputCompound.Root style={[styles.rootStyle, style]} testID={testID}>
			{children}
		</TextInputCompound.Root>
	)
}

const styles = StyleSheet.create({
	rootStyle: {
		paddingHorizontal: 0,
		paddingVertical: 0,
		paddingRight: 16,
	},
})
