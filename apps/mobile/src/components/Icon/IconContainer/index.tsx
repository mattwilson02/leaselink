import { colors } from '@sf-digital-ui/tokens'
import { View, type ViewProps } from 'react-native'

interface IconContainerProps extends ViewProps {
	hasBackground?: boolean
	color?: string
}

const IconContainer = ({
	style,
	hasBackground = false,
	color = colors.neutral['40'],
	...props
}: IconContainerProps) => {
	return (
		<View
			style={[
				{
					position: hasBackground ? 'absolute' : 'relative',
					padding: 14,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: color,
				},
				style,
			]}
			{...props}
		/>
	)
}

export default IconContainer
