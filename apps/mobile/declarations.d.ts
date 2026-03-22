declare module '*.svg' {
	import type { SvgProps } from 'react-native-svg'
	const content: React.FC<SvgProps>
	export default content
}

declare module 'react-native-signature-canvas' {
	import type { Component } from 'react'
	import type { StyleProp, ViewStyle } from 'react-native'

	export interface SignatureCanvasProps {
		onOK?: (signature: string) => void
		onEmpty?: () => void
		onClear?: () => void
		onBegin?: () => void
		onEnd?: () => void
		descriptionText?: string
		clearText?: string
		confirmText?: string
		webStyle?: string
		backgroundColor?: string
		penColor?: string
		autoClear?: boolean
		style?: StyleProp<ViewStyle>
		trimWhitespace?: boolean
		imageType?: string
		dataURL?: string
	}

	export interface SignatureCanvasRef {
		readSignature: () => void
		clearSignature: () => void
	}

	export default class SignatureCanvas extends Component<SignatureCanvasProps> {
		readSignature(): void
		clearSignature(): void
	}
}
