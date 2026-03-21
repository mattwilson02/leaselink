import { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Easing } from 'react-native'
import { colors } from '@/design-system/theme'

const DocumentSkeleton = ({ numberOfSkeletons = 3 }) => {
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
		<View style={styles.skeletonContainer} testID='document-skeleton'>
			<View style={styles.leftContent}>
				<View style={styles.avatarSkeleton}>
					<Animated.View
						style={[
							styles.shimmer,
							{
								transform: [{ translateX: shimmerInterpolation }],
							},
						]}
					/>
				</View>

				<View style={styles.textContainer}>
					<View style={styles.titleSkeleton}>
						<Animated.View
							style={[
								styles.shimmer,
								{
									transform: [{ translateX: shimmerInterpolation }],
								},
							]}
						/>
					</View>

					<View style={styles.dateSkeleton}>
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
			</View>

			<View style={styles.rightContent}>
				<View style={styles.buttonSkeleton}>
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
		padding: 12,
		flex: 1,
	},
	skeletonContainer: {
		padding: 10,
		borderRadius: 8,
		flexDirection: 'row',
		justifyContent: 'space-between',
		backgroundColor: colors.neutral['10'],
		marginBottom: 8,
		height: 68,
		overflow: 'hidden',
	},
	leftContent: {
		flexDirection: 'row',
		gap: 16,
		alignItems: 'center',
		flex: 1,
	},
	avatarSkeleton: {
		width: 36,
		height: 48,
		borderRadius: 4,
		borderTopRightRadius: 12,
		backgroundColor: colors.neutral['40'],
		overflow: 'hidden',
	},
	textContainer: {
		gap: 6,
		flex: 1,
	},
	titleSkeleton: {
		height: 18,
		borderRadius: 4,
		backgroundColor: colors.neutral['40'],
		width: '80%',
		overflow: 'hidden',
	},
	dateSkeleton: {
		height: 14,
		borderRadius: 4,
		backgroundColor: colors.neutral['40'],
		width: '40%',
		marginTop: 6,
		overflow: 'hidden',
	},
	rightContent: {
		justifyContent: 'flex-end',
		alignItems: 'flex-end',
		paddingBottom: 4,
	},
	buttonSkeleton: {
		height: 40,
		width: 10,
		borderRadius: 4,
		backgroundColor: colors.neutral['40'],
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

const DocumentsListSkeleton = ({
	numberOfSkeletons = 7,
}: {
	numberOfSkeletons?: number
}) => {
	return <DocumentSkeleton numberOfSkeletons={numberOfSkeletons} />
}

export default DocumentsListSkeleton
