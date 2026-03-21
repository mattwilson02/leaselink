import { colors } from '@/design-system/theme'

import { useEffect, useCallback, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
	runOnJS,
} from 'react-native-reanimated'

interface SnackbarProps {
	visible: boolean
	duration?: number
	onHide: () => void
	children: ReactNode
}

export const Snackbar = ({
	visible,
	duration = 5000,
	onHide,
	children,
}: SnackbarProps) => {
	const translateY = useSharedValue(100)
	const opacity = useSharedValue(0)

	const hideSnackbar = useCallback(() => {
		opacity.value = withTiming(0, { duration: 300 })
		translateY.value = withTiming(100, { duration: 300 }, () => {
			runOnJS(onHide)()
		})
	}, [opacity, translateY, onHide])

	useEffect(() => {
		if (visible) {
			opacity.value = withTiming(1, { duration: 300 })
			translateY.value = withSpring(0, {
				damping: 15,
				stiffness: 150,
			})

			const timer = setTimeout(() => {
				hideSnackbar()
			}, duration)

			return () => clearTimeout(timer)
		}
	}, [visible, duration, hideSnackbar, opacity, translateY])

	const animatedStyle = useAnimatedStyle(() => {
		return {
			opacity: opacity.value,
			transform: [{ translateY: translateY.value }],
		}
	})

	if (!visible) return null

	return (
		<Animated.View
			style={[
				styles.container,
				{
					backgroundColor: colors.neutral['800'],
				},
				animatedStyle,
			]}
			testID='snackbar-container'
		>
			<View style={styles.content}>{children}</View>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		left: 16,
		right: 16,
		bottom: 50,
		borderRadius: 12,
		paddingVertical: 16,
		paddingHorizontal: 20,
		zIndex: 9999,
		elevation: 8,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 6,
	},
	content: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	iconContainer: {
		marginRight: 12,
	},
	message: {
		color: 'white',
		textAlign: 'center',
		flex: 1,
	},
})
