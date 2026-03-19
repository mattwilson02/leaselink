import {
	type SafeAreaViewProps,
	SafeAreaView as RNSafeAreaView,
} from 'react-native-safe-area-context'
import { baseLayoutStyles } from '../styles'

export const SafeAreaView = ({ style, ...props }: SafeAreaViewProps) => (
	<RNSafeAreaView
		style={[
			baseLayoutStyles.container,
			baseLayoutStyles.padding,
			baseLayoutStyles.componentWrapper,
			style,
		]}
		{...props}
	/>
)
