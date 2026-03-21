import { colors } from '@/design-system/theme'
import { Text } from '@/design-system/components/Typography'
import type { TextProps } from '@/design-system/components/Typography'
import type { PropsWithChildren } from 'react'
import { View } from 'react-native'

type ErrorTextProps = TextProps & {
	hasError: boolean
}

export const ErrorText = ({
	size = 'xs',
	style = { color: colors.error[500] },
	children,
	hasError = false,
	...rest
}: PropsWithChildren<ErrorTextProps>) => {
	return hasError ? (
		<Text size={size} style={style} {...rest}>
			{children}
		</Text>
	) : (
		<View style={{ height: 5 }} />
	)
}
