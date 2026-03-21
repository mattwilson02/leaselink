/**
 * Typography components to replace @sf-digital-ui/react-native Text and Heading
 */
import {
	Text as RNText,
	type TextProps as RNTextProps,
	StyleSheet,
} from 'react-native'
import { colors, typography } from '../theme'

type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl'
type FontWeight =
	| 'thin'
	| 'light'
	| 'regular'
	| 'medium'
	| 'semibold'
	| 'bold'
	| 'black'

export interface TextProps extends RNTextProps {
	size?: TextSize
	fontWeight?: FontWeight
}

const sizeMap: Record<TextSize, { fontSize: number; lineHeight: number }> = {
	xs: { fontSize: 12, lineHeight: 16 },
	sm: { fontSize: 14, lineHeight: 20 },
	base: { fontSize: 16, lineHeight: 24 },
	lg: { fontSize: 18, lineHeight: 28 },
	xl: { fontSize: 20, lineHeight: 28 },
}

const weightMap: Record<
	FontWeight,
	{ fontFamily: string; fontWeight: '400' | '500' | '600' | '700' }
> = {
	thin: { fontFamily: typography.fontFamily.regular, fontWeight: '400' },
	light: { fontFamily: typography.fontFamily.regular, fontWeight: '400' },
	regular: { fontFamily: typography.fontFamily.regular, fontWeight: '400' },
	medium: { fontFamily: typography.fontFamily.medium, fontWeight: '500' },
	semibold: { fontFamily: typography.fontFamily.semiBold, fontWeight: '600' },
	bold: { fontFamily: typography.fontFamily.bold, fontWeight: '700' },
	black: { fontFamily: typography.fontFamily.bold, fontWeight: '700' },
}

export const Text = ({
	size = 'base',
	fontWeight = 'regular',
	style,
	...props
}: TextProps) => {
	const sz = sizeMap[size] ?? sizeMap.base
	const wt = weightMap[fontWeight] ?? weightMap.regular
	return (
		<RNText
			style={[
				styles.base,
				{ fontSize: sz.fontSize, lineHeight: sz.lineHeight },
				{ fontFamily: wt.fontFamily, fontWeight: wt.fontWeight },
				style,
			]}
			{...props}
		/>
	)
}

type HeadingSize = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export interface HeadingProps extends RNTextProps {
	size?: HeadingSize
	fontWeight?: FontWeight
}

const headingSizeMap: Record<
	HeadingSize,
	{ fontSize: number; lineHeight: number }
> = {
	h1: { fontSize: 36, lineHeight: 40 },
	h2: { fontSize: 30, lineHeight: 36 },
	h3: { fontSize: 24, lineHeight: 32 },
	h4: { fontSize: 20, lineHeight: 28 },
	h5: { fontSize: 18, lineHeight: 28 },
	h6: { fontSize: 16, lineHeight: 24 },
}

export const Heading = ({
	size = 'h5',
	fontWeight = 'bold',
	style,
	...props
}: HeadingProps) => {
	const sz = headingSizeMap[size] ?? headingSizeMap.h5
	const wt = weightMap[fontWeight] ?? weightMap.bold
	return (
		<RNText
			style={[
				styles.heading,
				{ fontSize: sz.fontSize, lineHeight: sz.lineHeight },
				{ fontFamily: wt.fontFamily, fontWeight: wt.fontWeight },
				style,
			]}
			{...props}
		/>
	)
}

const styles = StyleSheet.create({
	base: {
		color: colors.foreground,
		fontFamily: typography.fontFamily.regular,
	},
	heading: {
		color: colors.foreground,
		fontFamily: typography.fontFamily.bold,
	},
})
