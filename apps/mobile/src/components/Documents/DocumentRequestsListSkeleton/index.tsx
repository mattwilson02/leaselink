import { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Easing } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { colors } from '@sf-digital-ui/tokens'

const DocumentRequestsListSkeleton = ({ numberOfSkeletons = 3 }) => {
	const shimmerAnimation = useRef(new Animated.Value(0)).current

	useEffect(() => {
		const startShimmerAnimation = () => {
			shimmerAnimation.setValue(0)
			Animated.timing(shimmerAnimation, {
				toValue: 1,
				duration: 1500,
				easing: Easing.linear,
				useNativeDriver: false,
			}).start(() => startShimmerAnimation())
		}

		startShimmerAnimation()
	}, [shimmerAnimation])

	const shimmerInterpolation = shimmerAnimation.interpolate({
		inputRange: [0, 1],
		outputRange: ['-100%', '100%'],
	})

	// biome-ignore lint/style/useNamingConvention: React component
	const SkeletonItem = () => (
		<View style={styles.skeletonContainer} testID='document-request-skeleton'>
			<View style={styles.leftContent}>
				<View style={styles.iconSkeleton}>
					<Animated.View
						style={[
							styles.shimmer,
							{
								transform: [{ translateX: shimmerInterpolation }],
							},
						]}
					/>
				</View>

				<View style={styles.textSkeleton}>
					<Animated.View
						style={[
							styles.shimmer,
							{
								transform: [{ translateX: shimmerInterpolation }],
							},
						]}
					/>
				</View>
			</View>

			<View style={styles.badgeSkeleton}>
				<Animated.View
					style={[
						styles.shimmer,
						{
							transform: [{ translateX: shimmerInterpolation }],
						},
					]}
				/>
			</View>

			<ChevronRight size={20} color={colors.neutral['80']} />
		</View>
	)

	return (
		<View style={styles.container}>
			{/* biome-ignore lint/style/useNamingConvention: Item not used */}
			{[...Array(numberOfSkeletons)].map((_, index) => (
				<SkeletonItem key={index} />
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		gap: 12,
	},
	skeletonContainer: {
		padding: 10,
		flexDirection: 'row',
		justifyContent: 'space-between',
		borderRadius: 8,
		borderColor: colors.neutral['10'],
		borderWidth: 1,
		alignItems: 'center',
		boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
		overflow: 'hidden',
	},
	leftContent: {
		flexDirection: 'row',
		gap: 12,
		alignItems: 'center',
		flex: 1,
	},
	iconSkeleton: {
		width: 32,
		height: 32,
		backgroundColor: colors.neutral['40'],
		borderRadius: 8,
		overflow: 'hidden',
	},
	textSkeleton: {
		width: 120,
		height: 16,
		backgroundColor: colors.neutral['40'],
		borderRadius: 4,
		overflow: 'hidden',
	},
	badgeSkeleton: {
		borderRadius: 16,
		borderWidth: 1,
		borderColor: colors.neutral['40'],
		backgroundColor: colors.neutral['40'],
		paddingHorizontal: 8,
		paddingVertical: 2,
		width: 60,
		height: 20,
		overflow: 'hidden',
	},
	shimmer: {
		width: '100%',
		height: '100%',
		backgroundColor: colors.neutral['50'],
		opacity: 0.5,
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
})

export default DocumentRequestsListSkeleton
