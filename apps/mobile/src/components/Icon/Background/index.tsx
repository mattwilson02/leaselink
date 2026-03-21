import { colors } from '@/design-system/theme'
import type { SvgProps } from 'react-native-svg'
import { iconRegistry } from '@/constants/icons'

type IconName = keyof typeof iconRegistry
interface IconBackgroundProps extends SvgProps {
	name: IconName
	size?: number
}

const IconBackground = ({
	name = 'background',
	size = 24,
	fill,
	stroke = colors.neutral['500'],
	...props
}: IconBackgroundProps) => {
	// biome-ignore lint/style/useNamingConvention: <explanation>
	const Svg = iconRegistry[name]
	return (
		<Svg width={size} fill={fill} stroke={stroke} height={size} {...props} />
	)
}

export default IconBackground
