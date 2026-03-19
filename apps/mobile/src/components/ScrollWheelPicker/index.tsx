import { colors } from '@sf-digital-ui/tokens'
import { useCallback, useRef, useEffect, useMemo } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Pressable,
	type NativeSyntheticEvent,
	type NativeScrollEvent,
} from 'react-native'

const ITEM_HEIGHT = 44
// Number of items visible above/below the center selection
const ITEMS_ABOVE_CENTER = 2

interface ScrollWheelPickerProps {
	items: { value: string; label: string }[]
	selectedValue: string
	onValueChange: (value: string) => void
	label?: string
	flex?: number
}

export const ScrollWheelPicker = ({
	items,
	selectedValue,
	onValueChange,
	label,
	flex = 1,
}: ScrollWheelPickerProps) => {
	const scrollViewRef = useRef<ScrollView>(null)

	// Find the index of the selected value
	// If not found, determine whether to snap to beginning or end based on value comparison
	const selectedIndex = items.findIndex((item) => item.value === selectedValue)
	const initialIndex = (() => {
		if (selectedIndex >= 0) return selectedIndex
		if (items.length === 0) return 0

		const selectedNum = Number(selectedValue)
		const firstItemNum = Number(items[0].value)
		const lastItemNum = Number(items[items.length - 1].value)

		if (selectedNum < firstItemNum) return 0

		if (selectedNum > lastItemNum) return items.length - 1

		return items.length - 1
	})()

	const snapOffsets = useMemo(
		// biome-ignore lint/style/useNamingConvention: _ is idiomatic for unused parameters
		() => items.map((_, index) => index * ITEM_HEIGHT),
		[items],
	)

	const verticalPadding = ITEMS_ABOVE_CENTER * ITEM_HEIGHT

	useEffect(() => {
		if (selectedIndex === -1 && items.length > 0) {
			const newValue = items[initialIndex].value
			if (newValue !== selectedValue) {
				onValueChange(newValue)
			}
		}
	}, [selectedIndex, initialIndex, items, selectedValue, onValueChange])

	const handleScroll = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			const offsetY = event.nativeEvent.contentOffset.y
			const index = snapOffsets.findIndex((offset) => offset === offsetY)
			if (index !== -1 && items[index]?.value !== selectedValue) {
				onValueChange(items[index].value)
			}
		},
		[snapOffsets, items, selectedValue, onValueChange],
	)

	const handleItemPress = useCallback((index: number) => {
		scrollViewRef.current?.scrollTo({
			y: index * ITEM_HEIGHT,
			animated: true,
		})
	}, [])

	return (
		<View style={[styles.container, { flex }]}>
			{label && <Text style={styles.label}>{label}</Text>}
			<View style={styles.pickerContainer}>
				{/* Highlight bar in the center */}
				<View style={styles.highlightBar} pointerEvents='none' />

				<ScrollView
					ref={scrollViewRef}
					showsVerticalScrollIndicator={false}
					snapToOffsets={snapOffsets}
					decelerationRate='fast'
					onMomentumScrollEnd={handleScroll}
					contentContainerStyle={{
						paddingTop: verticalPadding,
						paddingBottom: verticalPadding,
					}}
					contentOffset={{
						x: 0,
						y: initialIndex * ITEM_HEIGHT,
					}}
				>
					{items.map((item, index) => {
						const isSelected = item.value === selectedValue
						return (
							<Pressable
								key={item.value}
								style={styles.itemContainer}
								onPress={() => handleItemPress(index)}
							>
								<Text
									style={[
										styles.itemText,
										isSelected && styles.itemTextSelected,
									]}
								>
									{item.label}
								</Text>
							</Pressable>
						)
					})}
				</ScrollView>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {},
	label: {
		fontSize: 14,
		fontWeight: '500',
		color: colors.neutral['600'],
		marginBottom: 8,
		textAlign: 'center',
	},
	pickerContainer: {
		height: ITEM_HEIGHT * 5, // Show 5 items at a time
		overflow: 'hidden',
		position: 'relative',
	},
	highlightBar: {
		position: 'absolute',
		top: ITEM_HEIGHT * 2, // Center position (2 items from top)
		left: 0,
		right: 0,
		height: ITEM_HEIGHT,
		backgroundColor: colors['primary-green']['50'],
		borderRadius: 8,
		zIndex: 0,
	},
	itemContainer: {
		height: ITEM_HEIGHT,
		justifyContent: 'center',
		alignItems: 'center',
	},
	itemText: {
		fontSize: 18,
		color: colors.neutral['400'],
	},
	itemTextSelected: {
		color: colors['primary-green']['700'],
		fontWeight: '600',
	},
})
