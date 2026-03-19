import { StyleSheet, View, Dimensions } from 'react-native'
import { useEffect } from 'react'
import Animated, {
	useSharedValue,
	useAnimatedProps,
	withTiming,
	Easing,
	runOnJS,
} from 'react-native-reanimated'
import { SplashScreen } from 'expo-router'
import WhiteLogo from '@/assets/images/white-logo.svg'
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg'
import greenBackground from '@/assets/images/green-background.png'
import { useInitialRoute } from '@/hooks/useInitialRoute'

const { width, height } = Dimensions.get('window')
const SCREEN_DIAGONAL = Math.sqrt(width * width + height * height)

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const CustomSplashScreen = () => {
	const { handleInitialRoute } = useInitialRoute()

	const circleRadius = useSharedValue(0)

	useEffect(() => {
		const animationDuration = 600

		circleRadius.value = withTiming(
			SCREEN_DIAGONAL,
			{
				duration: animationDuration,
				easing: Easing.inOut(Easing.quad),
			},
			(finished) => {
				if (finished) {
					runOnJS(handleInitialRoute)()
				}
			},
		)
	}, [circleRadius, handleInitialRoute])

	const animatedCircleProps = useAnimatedProps(() => {
		return {
			r: circleRadius.value,
		}
	})

	SplashScreen.hideAsync()

	return (
		<View style={styles.container} testID='splash-container'>
			<View style={styles.imageContainer}>
				<Animated.Image
					testID='splash-background-image'
					style={{ width: '100%', height: '100%' }}
					source={greenBackground}
				/>
			</View>
			<WhiteLogo testID='white-logo' width={250} height={200} />
			<View style={[StyleSheet.absoluteFillObject]}>
				<Svg height='100%' width='100%' style={StyleSheet.absoluteFill}>
					<Defs>
						<Mask id='circleMask' x={0} y={0} width='100%' height='100%'>
							<Rect width='100%' height='100%' fill='white' />
							<AnimatedCircle
								cx={width / 2}
								cy={height / 2}
								animatedProps={animatedCircleProps}
								fill='black'
							/>
						</Mask>
					</Defs>
					<Rect
						width='100%'
						height='100%'
						fill='white'
						mask='url(#circleMask)'
					/>
				</Svg>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
	},
	imageContainer: {
		position: 'absolute',
		width: '100%',
		height: '100%',
	},
})

export default CustomSplashScreen
