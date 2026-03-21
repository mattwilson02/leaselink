import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native'
import { colors, borderRadius, shadows } from '../theme'

interface CardProps extends ViewProps {
	style?: ViewStyle
}

export const Card = ({ style, children, ...props }: CardProps) => {
	return (
		<View style={[styles.card, style]} {...props}>
			{children}
		</View>
	)
}

export const CardHeader = ({ style, children, ...props }: CardProps) => {
	return (
		<View style={[styles.header, style]} {...props}>
			{children}
		</View>
	)
}

export const CardContent = ({ style, children, ...props }: CardProps) => {
	return (
		<View style={[styles.content, style]} {...props}>
			{children}
		</View>
	)
}

export const CardFooter = ({ style, children, ...props }: CardProps) => {
	return (
		<View style={[styles.footer, style]} {...props}>
			{children}
		</View>
	)
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: colors.card,
		borderRadius: borderRadius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		...shadows.sm,
	},
	header: {
		padding: 16,
		paddingBottom: 0,
	},
	content: {
		padding: 16,
	},
	footer: {
		padding: 16,
		paddingTop: 0,
		flexDirection: 'row',
		alignItems: 'center',
	},
})

export default Card
