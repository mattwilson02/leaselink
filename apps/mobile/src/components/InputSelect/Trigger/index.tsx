import {
	Select as DesignSystemSelect,
	type SelectTriggerProps,
} from '@sf-digital-ui/react-native'
import { StyleSheet } from 'react-native'

export const Trigger = ({ style, ...props }: SelectTriggerProps) => {
	return (
		<DesignSystemSelect.Trigger
			style={[styles.triggerStyle, typeof style === 'object' ? style : {}]}
			{...props}
		/>
	)
}

const styles = StyleSheet.create({
	triggerStyle: {
		borderColor: 'transparent',
	},
})
