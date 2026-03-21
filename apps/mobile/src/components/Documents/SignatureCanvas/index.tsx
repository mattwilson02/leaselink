import { useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import SignatureCanvas from 'react-native-signature-canvas'
import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'

export interface SignatureCanvasProps {
	onSignature: (base64Png: string) => void
	onClear: () => void
}

// Minimum data length to consider a signature non-trivial.
// A blank canvas PNG is roughly ~2KB; a real signature is larger.
const MIN_SIGNATURE_DATA_LENGTH = 5000

const SignatureCanvasComponent = ({
	onSignature,
	onClear,
}: SignatureCanvasProps) => {
	const ref = useRef<SignatureCanvas>(null)

	const handleOK = (signature: string) => {
		// react-native-signature-canvas returns a data URI: "data:image/png;base64,..."
		const base64 = signature.replace('data:image/png;base64,', '')
		if (base64.length < MIN_SIGNATURE_DATA_LENGTH) {
			// Signature is too small to be real — treat as empty
			return
		}
		onSignature(base64)
	}

	const handleClear = () => {
		ref.current?.clearSignature()
		onClear()
	}

	const handleConfirm = () => {
		ref.current?.readSignature()
	}

	const webStyle = `
		.m-signature-pad {
			box-shadow: none;
			border: none;
			margin: 0;
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
		}
		.m-signature-pad--body {
			border: none;
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
		}
		.m-signature-pad--footer {
			display: none;
		}
		body, html {
			width: 100%;
			height: 100%;
			margin: 0;
			padding: 0;
			background-color: #ffffff;
		}
	`

	return (
		<View style={styles.container}>
			<View style={styles.canvasWrapper}>
				<SignatureCanvas
					ref={ref}
					onOK={handleOK}
					onEmpty={() => {}}
					descriptionText=''
					clearText='Clear'
					confirmText='Confirm'
					webStyle={webStyle}
					backgroundColor='#ffffff'
					penColor='#18181b'
					autoClear={false}
					style={styles.canvas}
				/>
				<View style={styles.canvasBorder} pointerEvents='none' />
			</View>

			<View style={styles.actions}>
				<Button.Root
					variant='outline'
					onPress={handleClear}
					style={styles.clearButton}
				>
					<Button.Text>Clear</Button.Text>
				</Button.Root>
				<Button.Root
					variant='primary'
					onPress={handleConfirm}
					style={styles.confirmButton}
				>
					<Button.Text>Confirm Signature</Button.Text>
				</Button.Root>
			</View>

			<View style={styles.guidelineRow}>
				<View style={styles.guidelineLine} />
				<Text size='xs' style={styles.guidelineText}>
					Sign above
				</Text>
				<View style={styles.guidelineLine} />
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		gap: 12,
	},
	canvasWrapper: {
		height: 200,
		borderRadius: 8,
		overflow: 'hidden',
		backgroundColor: colors.white,
		position: 'relative',
	},
	canvas: {
		flex: 1,
		backgroundColor: colors.white,
	},
	canvasBorder: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.border,
	},
	actions: {
		flexDirection: 'row',
		gap: 8,
	},
	clearButton: {
		flex: 1,
	},
	confirmButton: {
		flex: 2,
	},
	guidelineRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginTop: 4,
	},
	guidelineLine: {
		flex: 1,
		height: 1,
		backgroundColor: colors.neutral['200'],
	},
	guidelineText: {
		color: colors.neutral['400'],
	},
})

export default SignatureCanvasComponent
