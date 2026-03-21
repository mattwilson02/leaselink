import { View, ScrollView, Animated, Easing, StyleSheet } from 'react-native'
import { useEffect, useRef } from 'react'
import FolderItem from '../FolderItem'
import type { FolderItemDTO } from '../../../gen/api/FolderItemDTO'
import { useGetFolderSummaryControllerFindAll } from '../../../gen/api/react-query/useGetFolderSummaryControllerFindAll'
import dayjs from 'dayjs'
import { colors } from '@/design-system/theme'

type FolderListSkeletonProps = {
	shimmerInterpolation: Animated.AnimatedInterpolation<string | number>
}

const FolderListSkeleton = ({
	shimmerInterpolation,
}: FolderListSkeletonProps) => (
	<ScrollView
		horizontal
		showsHorizontalScrollIndicator={false}
		contentContainerStyle={{ gap: 22 }}
	>
		{/* biome-ignore lint/style/useNamingConvention: <explanation> */}
		{[...Array(3)].map((_, index) => (
			<View key={index} style={styles.folderSkeleton}>
				<Animated.View
					style={[
						styles.shimmer,
						{
							transform: [{ translateX: shimmerInterpolation }],
						},
					]}
				/>
			</View>
		))}
	</ScrollView>
)

const FolderList = () => {
	const { data, isFetching, isError } = useGetFolderSummaryControllerFindAll()
	const folders: FolderItemDTO[] = data?.documentsByFolder || []

	const shimmerAnimation = useRef(new Animated.Value(0)).current

	useEffect(() => {
		let animation: Animated.CompositeAnimation | null = null

		if (isFetching) {
			const startShimmerAnimation = () => {
				shimmerAnimation.setValue(0)
				animation = Animated.timing(shimmerAnimation, {
					toValue: 1,
					duration: 1500,
					easing: Easing.linear,
					useNativeDriver: false,
				})
				animation.start(({ finished }) => {
					if (finished) {
						startShimmerAnimation()
					}
				})
			}

			startShimmerAnimation()
		}

		return () => {
			if (animation) {
				animation.stop()
			}
		}
	}, [isFetching, shimmerAnimation])

	const shimmerInterpolation = shimmerAnimation.interpolate({
		inputRange: [0, 1],
		outputRange: ['-100%', '100%'],
	})

	if (isFetching) {
		return <FolderListSkeleton shimmerInterpolation={shimmerInterpolation} />
	}

	if (isError) {
		return null
	}

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={{ gap: 22 }}
		>
			{folders.map((folder, index) => (
				<FolderItem
					key={index}
					folderName={folder.folderName}
					fileCount={folder.fileCount}
					size={folder.totalFileSizeSum}
					mostRecentUpdatedDate={dayjs(data?.mostRecentUpdatedDate).format(
						'DD MMM, YYYY',
					)}
				/>
			))}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	folderSkeleton: {
		width: 100,
		height: 100,
		borderRadius: 12,
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

export default FolderList
