import { useEffect, useRef } from 'react'
import { colors } from '@/design-system/theme'
import {
	View,
	Animated,
	Easing,
	StyleSheet,
	type ViewStyle,
} from 'react-native'

const DocumentDetailsCardSkeleton = () => {
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
	const SkeletonBox = ({ style }: { style: ViewStyle }) => (
		<View style={[style, styles.skeletonBase]}>
			<Animated.View
				style={[
					styles.shimmer,
					{
						transform: [{ translateX: shimmerInterpolation }],
					},
				]}
			/>
		</View>
	)

	return (
		<View
			testID='document-details-skeleton'
			style={{
				padding: 16,
				borderWidth: 1,
				borderColor: colors.neutral['30'],
				borderRadius: 8,
				gap: 24,
			}}
		>
			{/* Document name skeleton */}
			<View style={{ gap: 12 }}>
				<SkeletonBox
					style={{
						height: 24,
						width: '70%',
						borderRadius: 4,
					}}
				/>
			</View>

			{/* Folder skeleton */}
			<View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
				<SkeletonBox
					style={{
						width: 18,
						height: 18,
						borderRadius: 2,
					}}
				/>
				<SkeletonBox
					style={{
						height: 16,
						width: 120,
						borderRadius: 4,
					}}
				/>
			</View>

			{/* Details skeleton */}
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				{/* Size skeleton */}
				<View style={{ gap: 8 }}>
					<SkeletonBox
						style={{
							height: 16,
							width: 30,
							borderRadius: 4,
						}}
					/>
					<SkeletonBox
						style={{
							height: 16,
							width: 60,
							borderRadius: 4,
						}}
					/>
				</View>

				{/* Type skeleton */}
				<View style={{ gap: 8 }}>
					<SkeletonBox
						style={{
							height: 16,
							width: 35,
							borderRadius: 4,
						}}
					/>
					<SkeletonBox
						style={{
							height: 16,
							width: 80,
							borderRadius: 4,
						}}
					/>
				</View>

				{/* Date skeleton */}
				<View style={{ gap: 8 }}>
					<SkeletonBox
						style={{
							height: 16,
							width: 35,
							borderRadius: 4,
						}}
					/>
					<SkeletonBox
						style={{
							height: 16,
							width: 85,
							borderRadius: 4,
						}}
					/>
				</View>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	skeletonBase: {
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

export default DocumentDetailsCardSkeleton
