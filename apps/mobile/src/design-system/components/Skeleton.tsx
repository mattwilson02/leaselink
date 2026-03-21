import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native'
import { colors } from '../theme'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export const Skeleton = ({
  width = '100%',
  height = 16,
  borderRadius: br = 4,
  style,
}: SkeletonProps) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const startShimmer = () => {
      shimmerAnimation.setValue(0)
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(() => startShimmer())
    }
    startShimmer()
  }, [shimmerAnimation])

  const shimmerInterpolation = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '100%'],
  })

  return (
    <View
      style={[
        styles.base,
        { width: width as number, height, borderRadius: br },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          { transform: [{ translateX: shimmerInterpolation }] },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.neutral['40'],
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.neutral['20'],
    opacity: 0.7,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})

export default Skeleton
