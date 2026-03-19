import { Keyboard, Pressable, type PressableProps } from 'react-native'
import { baseLayoutStyles } from '../styles'

export const KeyboardDismiss = ({ style, ...props }: PressableProps) => {
	return (
		<Pressable
			onPress={Keyboard.dismiss}
			style={[
				baseLayoutStyles.componentWrapper,
				typeof style === 'object' ? style : {},
			]}
			accessible={false}
			{...props}
		/>
	)
}
