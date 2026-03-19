import { Text, type TextProps } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'

export const Label = ({
	children,
	fontWeight = 'bold',
	style = {
		color: colors.neutral['700'],
	},
	...rest
}: TextProps) => {
	return (
		<Text fontWeight={fontWeight} style={style} {...rest}>
			{children}
		</Text>
	)
}
