import { SelectCompound, type SelectTriggerProps } from '@/design-system/components/SelectCompound'
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

export const Trigger = ({ style, ...props }: SelectTriggerProps) => {
	return (
		<SelectCompound.Trigger
			style={[styles.triggerStyle, style as StyleProp<ViewStyle>]}
			{...props}
		/>
	)
}

const styles = StyleSheet.create({
	triggerStyle: {
		borderColor: 'transparent',
	},
})
