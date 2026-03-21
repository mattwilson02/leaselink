import { Text } from '@/design-system/components/Typography'
import type { TextProps } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'

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
