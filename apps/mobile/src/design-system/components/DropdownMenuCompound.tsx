/**
 * DropdownMenu compound to replace @sf-digital-ui/react-native DropdownMenu.*
 * Simple implementation using Modal
 */
import { createContext, useContext, useRef, useState } from 'react'
import {
	Modal,
	Pressable,
	StyleSheet,
	View,
	type ViewStyle,
} from 'react-native'
import { colors, borderRadius, shadows } from '../theme'

interface DropdownContextType {
	open: boolean
	setOpen: (open: boolean) => void
}

const DropdownContext = createContext<DropdownContextType>({
	open: false,
	setOpen: () => {},
})

interface DropdownRootProps {
	children?: React.ReactNode
}

const DropdownRoot = ({ children }: DropdownRootProps) => {
	const [open, setOpen] = useState(false)
	return (
		<DropdownContext.Provider value={{ open, setOpen }}>
			<View>{children}</View>
		</DropdownContext.Provider>
	)
}

interface DropdownTriggerProps {
	children?: React.ReactNode
	style?: ViewStyle
}

const DropdownTrigger = ({ children, style }: DropdownTriggerProps) => {
	const { setOpen } = useContext(DropdownContext)
	return (
		<Pressable onPress={() => setOpen(true)} style={style}>
			{children}
		</Pressable>
	)
}

interface DropdownContentProps {
	children?: React.ReactNode
	style?: ViewStyle
}

const DropdownContent = ({ children, style }: DropdownContentProps) => {
	const { open, setOpen } = useContext(DropdownContext)
	return (
		<Modal
			visible={open}
			transparent
			animationType='fade'
			onRequestClose={() => setOpen(false)}
		>
			<Pressable style={styles.overlay} onPress={() => setOpen(false)}>
				<View style={[styles.content, style]}>{children}</View>
			</Pressable>
		</Modal>
	)
}

interface DropdownItemProps {
	children?: React.ReactNode
	onPress?: () => void
	style?: ViewStyle
	testID?: string
}

const DropdownItem = ({
	children,
	onPress,
	style,
	testID,
}: DropdownItemProps) => {
	const { setOpen } = useContext(DropdownContext)
	return (
		<Pressable
			testID={testID}
			onPress={() => {
				onPress?.()
				setOpen(false)
			}}
			style={[styles.item, style]}
		>
			{children}
		</Pressable>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.2)',
		justifyContent: 'flex-end',
		paddingBottom: 40,
		paddingHorizontal: 16,
	},
	content: {
		backgroundColor: colors.card,
		borderRadius: borderRadius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		overflow: 'hidden',
		...shadows.md,
	},
	item: {
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
})

export const DropdownMenuCompound = {
	Root: DropdownRoot,
	Trigger: DropdownTrigger,
	Content: DropdownContent,
	Item: DropdownItem,
}

export default DropdownMenuCompound
