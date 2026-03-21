/**
 * Modal compound to replace @sf-digital-ui/react-native Modal.*
 */
import {
	Modal,
	Pressable,
	StyleSheet,
	Text,
	View,
	type ViewStyle,
} from 'react-native'
import { colors, typography, borderRadius, shadows } from '../theme'

interface ModalRootProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	children?: React.ReactNode
}

const ModalRoot = ({ open, onOpenChange, children }: ModalRootProps) => {
	return (
		<Modal
			visible={open}
			transparent
			animationType='fade'
			onRequestClose={() => onOpenChange(false)}
		>
			<Pressable style={styles.overlay} onPress={() => onOpenChange(false)}>
				<Pressable style={styles.card} onPress={(e) => e?.stopPropagation?.()}>
					{children}
				</Pressable>
			</Pressable>
		</Modal>
	)
}

interface ModalHeaderProps {
	icon?: React.ReactNode
	style?: ViewStyle
	circularBackgroundColor?: string
}

const ModalHeader = ({
	icon,
	style,
	circularBackgroundColor,
}: ModalHeaderProps) => {
	return (
		<View style={[styles.header, style]}>
			{icon && (
				<View
					style={[
						styles.iconCircle,
						circularBackgroundColor
							? { backgroundColor: circularBackgroundColor }
							: undefined,
					]}
				>
					{icon}
				</View>
			)}
		</View>
	)
}

interface ModalBodyProps {
	children?: React.ReactNode
}

const ModalBody = ({ children }: ModalBodyProps) => {
	return <View style={styles.body}>{children}</View>
}

interface ModalTitleProps {
	children?: React.ReactNode
	testID?: string
}

const ModalTitle = ({ children, testID }: ModalTitleProps) => {
	return (
		<Text testID={testID ?? 'modal-title'} style={styles.title}>
			{children}
		</Text>
	)
}

interface ModalDescriptionProps {
	children?: React.ReactNode
	testID?: string
}

const ModalDescription = ({ children, testID }: ModalDescriptionProps) => {
	return (
		<Text testID={testID ?? 'modal-description'} style={styles.description}>
			{children}
		</Text>
	)
}

interface ModalFooterProps {
	children?: React.ReactNode
}

const ModalFooter = ({ children }: ModalFooterProps) => {
	return <View style={styles.footer}>{children}</View>
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
	},
	card: {
		backgroundColor: colors.card,
		borderRadius: borderRadius.xl,
		width: '100%',
		overflow: 'hidden',
		...shadows.lg,
	},
	header: {
		padding: 16,
		alignItems: 'center',
	},
	iconCircle: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: colors.muted,
		alignItems: 'center',
		justifyContent: 'center',
	},
	body: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		gap: 8,
	},
	title: {
		fontSize: typography.fontSize.lg,
		fontFamily: typography.fontFamily.bold,
		fontWeight: '700',
		color: colors.foreground,
		textAlign: 'center',
	},
	description: {
		fontSize: typography.fontSize.sm,
		fontFamily: typography.fontFamily.regular,
		color: colors.mutedForeground,
		textAlign: 'center',
	},
	footer: {
		padding: 16,
		paddingTop: 8,
	},
})

export const ModalCompound = {
	Root: ModalRoot,
	Header: ModalHeader,
	Body: ModalBody,
	Title: ModalTitle,
	Description: ModalDescription,
	Footer: ModalFooter,
}

export default ModalCompound
