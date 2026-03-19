import { colors } from '@sf-digital-ui/tokens'
import type { SvgProps } from 'react-native-svg'
import { iconRegistry } from '@/constants/icons'

type IconName = keyof typeof iconRegistry

interface IconProps extends SvgProps {
	name: IconName
	size?: number
}

const Icon = ({
	name,
	size = 24,
	fill = 'white',
	strokeLinecap = 'round',
	strokeLinejoin = 'round',
	testID = `icon-${name}`,
	stroke = colors.neutral['500'],
	...props
}: IconProps) => {
	// biome-ignore lint/style/useNamingConvention: React component
	const Svg = iconRegistry[name]

	if (Svg) {
		return (
			<Svg
				testID={testID}
				width={size}
				strokeLinecap={strokeLinecap}
				strokeLinejoin={strokeLinejoin}
				fill={fill}
				stroke={stroke}
				height={size}
				{...props}
			/>
		)
	}
}

export default Icon
