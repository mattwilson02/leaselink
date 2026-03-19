import { View, type ViewProps } from 'react-native'

const Root = ({ style, ...props }: ViewProps) => {
	return (
		<View
			style={[
				{
					justifyContent: 'center',
					alignItems: 'center',
				},
				style,
			]}
			{...props}
		/>
	)
}

export default Root
