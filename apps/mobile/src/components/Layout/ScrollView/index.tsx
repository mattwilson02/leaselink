import { forwardRef } from 'react'
import { type ScrollViewProps, ScrollView as RNScrollView } from 'react-native'
import { baseLayoutStyles } from '../styles'

export const ScrollView = forwardRef<RNScrollView, ScrollViewProps>(
	({ style, ...props }, ref) => (
		<RNScrollView
			ref={ref}
			style={[baseLayoutStyles.componentWrapper, style]}
			{...props}
		/>
	),
)
