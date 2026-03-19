import { colors } from '@sf-digital-ui/tokens'
import { View } from 'react-native'

export const CircleBackground = ({ color = colors.neutral['40'] }) => {
	const radiusSeries = [47.5, 71.5, 95.5, 119.5, 145.5]
	const opacities = [1, 0.8, 0.6, 0.4, 0.2]

	return (
		<View
			style={{
				position: 'absolute',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			{radiusSeries.map((radius, index) => (
				<View
					key={index}
					style={{
						position: 'absolute',
						width: radius * 2,
						height: radius * 2,
						borderColor: color,
						borderRadius: radius,
						opacity: opacities[index],
						borderWidth: 1,
					}}
				/>
			))}
		</View>
	)
}
